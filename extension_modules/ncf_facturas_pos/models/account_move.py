# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class AccountMoveNCF(models.Model):
    _inherit = 'account.move'
    
    # NCF Fields
    ncf_type_id = fields.Many2one(
        'ncf.type',
        string='Tipo NCF',
        help='Tipo de Comprobante Fiscal'
    )
    ncf_sequence_id = fields.Many2one(
        'ncf.sequence',
        string='Secuencia NCF',
        help='Secuencia de NCF activa'
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
        help='RNC o Cédula del cliente'
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
        """Actualiza las secuencias disponibles cuando cambia el tipo NCF"""
        if self.ncf_type_id:
            # Filtrar secuencias activas para el tipo seleccionado
            domain = [
                ('ncf_type_id', '=', self.ncf_type_id.id),
                ('is_active', '=', True)
            ]
            # Buscar secuencias disponibles (con números restantes)
            sequences = self.env['ncf.sequence'].search(domain)
            available_sequences = sequences.filtered(lambda s: s.current_number <= s.sequence_end)
            
            if available_sequences:
                # Seleccionar la primera secuencia disponible
                self.ncf_sequence_id = available_sequences[0]
            else:
                self.ncf_sequence_id = False

    @api.onchange('partner_id')
    def _onchange_partner_ncf(self):
        """Determina automáticamente el tipo NCF basado en el cliente"""
        if self.partner_id:
            # Obtener RNC del cliente
            self.customer_rnc = self.partner_id.vat or ''
            
            # Sugerir tipo NCF basado en el cliente
            if self.partner_id.vat:
                # Cliente tiene RNC - puede usar B01
                if self.partner_id.is_company:
                    suggested_type = self.env['ncf.type'].search([('code', '=', 'B01')], limit=1)
                else:
                    suggested_type = self.env['ncf.type'].search([('code', '=', 'B01')], limit=1)
            else:
                # Cliente sin RNC - usar B02
                suggested_type = self.env['ncf.type'].search([('code', '=', 'B02')], limit=1)
            
            if suggested_type:
                self.ncf_type_id = suggested_type

    def _generate_ncf_number(self):
        """Genera el número NCF automáticamente"""
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

    def action_post(self):
        """Genera NCF automáticamente al confirmar la factura"""
        for move in self:
            if move.move_type in ('out_invoice', 'out_refund') and not move.ncf_number:
                if move.ncf_sequence_id:
                    move.ncf_number = move._generate_ncf_number()
                else:
                    raise UserError(_('Debe configurar el tipo y secuencia NCF antes de confirmar la factura.'))
        
        return super().action_post()

    @api.constrains('ncf_type_id', 'partner_id')
    def _check_ncf_partner_requirements(self):
        """Valida que el tipo NCF sea compatible con el cliente"""
        for move in self:
            if move.ncf_type_id and move.partner_id:
                # B01 y B14 requieren RNC
                if move.ncf_type_id.code in ['B01', 'B14', 'B15'] and not move.partner_id.vat:
                    raise ValidationError(_(
                        'El tipo NCF %s requiere que el cliente tenga RNC/Cédula configurado.'
                    ) % move.ncf_type_id.name)