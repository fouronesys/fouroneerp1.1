# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class PosOrderNCF(models.Model):
    _inherit = 'pos.order'
    
    # NCF Fields
    ncf_type_id = fields.Many2one(
        'ncf.type',
        string='Tipo NCF',
        help='Tipo de Comprobante Fiscal para POS'
    )
    ncf_sequence_id = fields.Many2one(
        'ncf.sequence',
        string='Secuencia NCF',
        help='Secuencia de NCF activa para POS'
    )
    ncf_number = fields.Char(
        string='Número NCF',
        size=19,
        help='Número de Comprobante Fiscal generado automáticamente'
    )
    
    # RNC Information
    customer_rnc = fields.Char(
        string='RNC/Cédula Cliente',
        size=11,
        help='RNC o Cédula del cliente en POS'
    )
    
    @api.onchange('partner_id')
    def _onchange_partner_ncf_pos(self):
        """Determina automáticamente el tipo NCF basado en el cliente"""
        if self.partner_id:
            # Obtener RNC del cliente
            self.customer_rnc = self.partner_id.vat or ''
            
            # Sugerir tipo NCF basado en el cliente
            if self.partner_id.vat:
                # Cliente tiene RNC - puede usar B01
                suggested_type = self.env['ncf.type'].search([('code', '=', 'B01')], limit=1)
            else:
                # Cliente sin RNC - usar B02
                suggested_type = self.env['ncf.type'].search([('code', '=', 'B02')], limit=1)
            
            if suggested_type:
                self.ncf_type_id = suggested_type
                # Auto-seleccionar secuencia
                sequence = self.env['ncf.sequence'].search([
                    ('ncf_type_id', '=', suggested_type.id),
                    ('is_active', '=', True)
                ], limit=1)
                if sequence:
                    self.ncf_sequence_id = sequence
        else:
            # Sin cliente - usar B02 por defecto
            default_type = self.env['ncf.type'].search([('code', '=', 'B02')], limit=1)
            if default_type:
                self.ncf_type_id = default_type
                sequence = self.env['ncf.sequence'].search([
                    ('ncf_type_id', '=', default_type.id),
                    ('is_active', '=', True)
                ], limit=1)
                if sequence:
                    self.ncf_sequence_id = sequence

    def _generate_ncf_number(self):
        """Genera el número NCF automáticamente para POS"""
        if not self.ncf_sequence_id:
            # Si no hay secuencia, usar B02 por defecto
            default_type = self.env['ncf.type'].search([('code', '=', 'B02')], limit=1)
            if default_type:
                sequence = self.env['ncf.sequence'].search([
                    ('ncf_type_id', '=', default_type.id),
                    ('is_active', '=', True)
                ], limit=1)
                if sequence:
                    self.ncf_type_id = default_type
                    self.ncf_sequence_id = sequence
                else:
                    return False  # No hay secuencias disponibles
            else:
                return False
        
        sequence = self.ncf_sequence_id
        
        # Verificar que la secuencia tenga números disponibles
        if sequence.current_number > sequence.end_number:
            # Buscar otra secuencia del mismo tipo
            other_sequence = self.env['ncf.sequence'].search([
                ('ncf_type_id', '=', sequence.ncf_type_id.id),
                ('is_active', '=', True),
                ('current_number', '<=', 'end_number'),
                ('id', '!=', sequence.id)
            ], limit=1)
            
            if other_sequence:
                self.ncf_sequence_id = other_sequence
                sequence = other_sequence
            else:
                raise UserError(_('No hay secuencias NCF %s disponibles.') % sequence.ncf_type_id.name)
        
        # Generar número NCF
        ncf_number = f"{sequence.ncf_type_id.code}{sequence.current_number:08d}"
        
        # Actualizar secuencia
        sequence.current_number += 1
        
        return ncf_number

    @api.model
    def _order_fields(self, order, ui_order):
        """Extender campos de orden para incluir NCF"""
        fields = super()._order_fields(order, ui_order)
        
        # Agregar campos NCF si están presentes
        if ui_order.get('ncf_type_id'):
            fields['ncf_type_id'] = ui_order['ncf_type_id']
        if ui_order.get('ncf_sequence_id'):
            fields['ncf_sequence_id'] = ui_order['ncf_sequence_id']
        if ui_order.get('customer_rnc'):
            fields['customer_rnc'] = ui_order['customer_rnc']
            
        return fields

    def _prepare_invoice_vals(self):
        """Preparar valores de factura incluyendo NCF"""
        vals = super()._prepare_invoice_vals()
        
        # Transferir información NCF a la factura
        if self.ncf_type_id:
            vals['ncf_type_id'] = self.ncf_type_id.id
        if self.ncf_sequence_id:
            vals['ncf_sequence_id'] = self.ncf_sequence_id.id
        if self.customer_rnc:
            vals['customer_rnc'] = self.customer_rnc
            
        return vals

    def action_pos_order_paid(self):
        """Generar NCF automáticamente al marcar como pagado"""
        result = super().action_pos_order_paid()
        
        for order in self:
            if not order.ncf_number and order.amount_total > 0:
                ncf = order._generate_ncf_number()
                if ncf:
                    order.ncf_number = ncf
        
        return result