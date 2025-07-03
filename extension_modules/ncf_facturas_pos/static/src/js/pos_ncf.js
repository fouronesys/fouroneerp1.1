/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";

// Extensión del ProductScreen para agregar NCF
patch(ProductScreen.prototype, {
    setup() {
        super.setup();
        this.orm = useService("orm");
    },

    async selectNCFType() {
        const ncfTypes = await this.orm.searchRead("ncf.type", [], ["id", "code", "name"]);
        
        if (!ncfTypes.length) {
            this.popup.add("ErrorPopup", {
                title: _t("Error"),
                body: _t("No hay tipos de NCF configurados."),
            });
            return;
        }

        const { confirmed, payload } = await this.popup.add("SelectionPopup", {
            title: _t("Seleccionar Tipo de NCF"),
            list: ncfTypes.map(type => ({
                id: type.id,
                label: `${type.code} - ${type.name}`,
                item: type,
            })),
        });

        if (confirmed && payload) {
            const currentOrder = this.pos.get_order();
            if (currentOrder) {
                currentOrder.ncf_type_id = payload.id;
                currentOrder.ncf_type_code = payload.code;
                
                // Auto-seleccionar secuencia
                await this.selectNCFSequence(payload.id);
            }
        }
    },

    async selectNCFSequence(ncfTypeId) {
        const sequences = await this.orm.searchRead(
            "ncf.sequence", 
            [["ncf_type_id", "=", ncfTypeId], ["is_active", "=", true]], 
            ["id", "display_name", "available_numbers"]
        );

        if (!sequences.length) {
            this.popup.add("ErrorPopup", {
                title: _t("Error"),
                body: _t("No hay secuencias NCF disponibles para este tipo."),
            });
            return;
        }

        // Auto-seleccionar la primera secuencia disponible
        const currentOrder = this.pos.get_order();
        if (currentOrder && sequences[0]) {
            currentOrder.ncf_sequence_id = sequences[0].id;
        }
    },

    async setCustomerRNC() {
        const { confirmed, payload } = await this.popup.add("TextInputPopup", {
            title: _t("RNC del Cliente"),
            startingValue: this.pos.get_order().customer_rnc || "",
        });

        if (confirmed) {
            const currentOrder = this.pos.get_order();
            if (currentOrder) {
                currentOrder.customer_rnc = payload;
                
                // Auto-sugerir tipo NCF basado en RNC
                if (payload && payload.trim()) {
                    // Cliente con RNC - sugerir B01
                    const b01Type = await this.orm.searchRead("ncf.type", [["code", "=", "B01"]], ["id"]);
                    if (b01Type.length) {
                        currentOrder.ncf_type_id = b01Type[0].id;
                        await this.selectNCFSequence(b01Type[0].id);
                    }
                } else {
                    // Cliente sin RNC - sugerir B02
                    const b02Type = await this.orm.searchRead("ncf.type", [["code", "=", "B02"]], ["id"]);
                    if (b02Type.length) {
                        currentOrder.ncf_type_id = b02Type[0].id;
                        await this.selectNCFSequence(b02Type[0].id);
                    }
                }
            }
        }
    }
});