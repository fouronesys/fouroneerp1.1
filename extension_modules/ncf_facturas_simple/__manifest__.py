# -*- coding: utf-8 -*-
{
    'name': 'NCF Facturas - Extensión Simple',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Localizations',
    'summary': 'Integración NCF para Facturas de Venta',
    'description': """
Extensión simplificada del módulo NCF Dominicano para facturas

Características:
- Campos NCF en facturas de venta
- Conserva plantilla original de Odoo
- Generación automática de números NCF
- Cálculo automático de ITBIS
- Integración transparente con workflow de facturas

Instalación:
1. Primero instalar el módulo base 'ncf_dominicano'
2. Luego instalar esta extensión
    """,
    'author': "Four One Solutions",
    'website': "https://www.fourone.com.do",
    'depends': [
        'base',
        'ncf_dominicano',  # Módulo base requerido
        'account',         # Para integración con facturas
    ],
    'data': [
        'views/account_move_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}