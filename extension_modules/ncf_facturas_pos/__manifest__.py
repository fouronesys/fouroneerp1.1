# -*- coding: utf-8 -*-
{
    'name': 'NCF Facturas y POS - Extensión',
    'version': '17.0.1.0.0',
    'category': 'Accounting/Localizations',
    'summary': 'Extensión NCF para Facturas y Punto de Venta',
    'description': """
Extensión del módulo NCF Dominicano para integración con Facturas y POS

Características:
- Campos NCF en facturas de venta
- Integración completa con POS
- Generación automática de números NCF
- Reportes DGII integrados

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
        'point_of_sale',   # Para integración con POS
    ],
    'data': [
        'views/account_move_views.xml',
        'views/pos_order_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'ncf_facturas_pos/static/src/js/pos_ncf.js',
            'ncf_facturas_pos/static/src/xml/pos_ncf.xml',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}