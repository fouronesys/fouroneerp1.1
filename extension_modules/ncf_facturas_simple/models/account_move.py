# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class AccountMoveNCF(models.Model):
    _inherit = 'account.move'
    
    # NCF Fields
    ncf_type_id = fields.Many2one(
        'ncf.type',
        string='Tipo NCF',
        help='Tipo de Comprobante Fiscal',
        states={'draft': [('readonly', False)]},
        domain=[('active', '=', True)]
    )
    ncf_sequence_id = fields.Many2one(
        'ncf.sequence',
        string='Secuencia NCF',
        help='Secuencia de NCF activa',
        states={'draft': [('readonly', False)]}
    )
    ncf_number = fields.Char(
        string='Número NCF',
        size=19,
        readonly=True,
        help='Número de Comprobante Fiscal generado automáticamente'
    )
    
    # RNC Information
    customer_rnc = fields.Char(
        string='RNC/Cédula Cliente',
        size=11,
        help='RNC o Cédula del cliente',
        states={'draft': [('readonly', False)]}
    )
    
    # ITBIS Information
    itbis_amount = fields.Monetary(
        string='ITBIS',
        currency_field='currency_id',
        compute='_compute_itbis_amount',
        store=True
    )
    
    @api.depends('invoice_line_ids.price_subtotal', 'invoice_line_ids.tax_ids')
    def _compute_itbis_amount(self):
        """Calcula el monto de ITBIS basado en las líneas de factura"""
        for move in self:
            itbis_total = 0.0
            for line in move.invoice_line_ids:
                for tax in line.tax_ids:
                    if 'ITBIS' in tax.name.upper() or tax.amount == 18.0:
                        itbis_total += line.price_subtotal * (tax.amount / 100)
            move.itbis_amount = itbis_total

    @api.onchange('ncf_type_id')
    def _onchange_ncf_type_id(self):
        """Actualiza las secuencias disponibles según el tipo NCF seleccionado"""
        if self.ncf_type_id:
            # Obtener secuencias activas para el tipo seleccionado
            sequences = self.env['ncf.sequence'].search([
                ('ncf_type_id', '=', self.ncf_type_id.id),
                ('is_active', '=', True),
                ('current_number', '<=', 'sequence_end')
            ])
            
            if sequences:
                # Auto-seleccionar la primera secuencia disponible
                self.ncf_sequence_id = sequences[0]
            else:
                self.ncf_sequence_id = False
                return {
                    'warning': {
                        'title': _('Sin secuencias disponibles'),
                        'message': _('No hay secuencias NCF disponibles para el tipo seleccionado.')
                    }
                }
        else:
            self.ncf_sequence_id = False

    @api.onchange('partner_id')
    def _onchange_partner_id_ncf(self):
        """Auto-rellena RNC del cliente y sugiere tipo NCF"""
        if self.partner_id:
            # Buscar RNC del cliente
            if hasattr(self.partner_id, 'vat') and self.partner_id.vat:
                self.customer_rnc = self.partner_id.vat
            
            # Sugerir tipo NCF basado en si tiene RNC
            if self.customer_rnc:
                # Cliente con RNC → B01 Crédito Fiscal
                b01_type = self.env['ncf.type'].search([('code', '=', 'B01')], limit=1)
                if b01_type:
                    self.ncf_type_id = b01_type
            else:
                # Cliente sin RNC → B02 Consumidor Final  
                b02_type = self.env['ncf.type'].search([('code', '=', 'B02')], limit=1)
                if b02_type:
                    self.ncf_type_id = b02_type

    def action_post(self):
        """Override para generar NCF al confirmar factura"""
        for move in self:
            if move.move_type in ['out_invoice', 'out_refund'] and not move.ncf_number:
                # Generar número NCF automáticamente
                move.ncf_number = move._generate_ncf_number()
        
        return super(AccountMoveNCF, self).action_post()

    def _generate_ncf_number(self):
        """Genera el siguiente número NCF de la secuencia seleccionada"""
        if not self.ncf_sequence_id:
            raise UserError(_('Debe seleccionar una secuencia NCF válida.'))
        
        sequence = self.ncf_sequence_id
        
        # Verificar que la secuencia tenga números disponibles
        if sequence.current_number > sequence.sequence_end:
            raise UserError(_('La secuencia NCF %s ha alcanzado su límite máximo.') % sequence.display_name)
        
        # Generar número NCF
        ncf_number = f"{sequence.ncf_type_id.code}{sequence.current_number:08d}"
        
        # Actualizar secuencia
        sequence.current_number += 1
        
        return ncf_number

    @api.constrains('ncf_type_id', 'customer_rnc')
    def _check_ncf_rnc_consistency(self):
        """Validar consistencia entre tipo NCF y RNC del cliente"""
        for move in self:
            if move.ncf_type_id and move.ncf_type_id.requires_rnc and not move.customer_rnc:
                raise ValidationError(
                    _('El tipo NCF %s requiere RNC del cliente.') % move.ncf_type_id.name
                )