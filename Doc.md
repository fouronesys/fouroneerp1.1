# **Documentación Completa de FourOneSys ERP**  

---

## **📌 Estructura del Proyecto**  
```bash
fouronesysERP/
├── apps/                  # Módulos principales
│   ├── usuarios/         # Autenticación y perfiles
│   ├── inventario/       # Gestión de productos
│   ├── ventas/           # Facturación y clientes
│   └── contabilidad/     # Transacciones financieras
├── fouronesysERP/        # Configuración Django
│   ├── settings.py       # Configuración principal
│   └── urls.py           # Rutas globales
├── static/               # Assets estáticos
├── templates/            # Vistas HTML
├── requirements.txt      # Dependencias Python
└── manage.py             # CLI de Django
```

---

## **🔧 Requisitos Técnicos**  
| Componente       | Versión  | Notas                          |
|------------------|----------|--------------------------------|
| Python           | 3.9+     |                                |
| Django           | 4.0+     | Framework principal            |
| PostgreSQL       | 12+      | BD recomendada                 |
| Node.js          | 16+      | Opcional para assets           |

---

## **🚀 Guía de Instalación**  

### **1. Entorno Local**  
```bash
# Clonar repositorio
git clone https://github.com/fouronesys/fouronesysERP.git
cd fouronesysERP

# Configurar entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt
```

### **2. Variables de Entorno**  
Crear `.env` en la raíz:  
```env
SECRET_KEY=tu_clave_secreta
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/fouronesys
ALLOWED_HOSTS=localhost,127.0.0.1
```

### **3. Base de Datos**  
```bash
python manage.py migrate
python manage.py createsuperuser
```

---

## **📚 Módulos Principales**  

### **🔹 Usuarios**  
- Autenticación personalizada  
- Roles: Admin, Gerente, Vendedor  
- API endpoints: `/api/users/`  

### **🔹 Inventario**  
```python
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()
```
*Endpoints disponibles:*  
- `GET /api/inventario/productos/`  
- `POST /api/inventario/ajustes-stock/`  

### **🔹 Ventas**  
- Facturación electrónica (DGII-compatible)  
- Reportes de ventas por período  

---

## **⚙️ Configuración de Producción**  

### **1. Railway**  
```json
{
  "build": {
    "builder": "nixpacks",
    "config": {
      "NIXPACKS_PYTHON_VERSION": "3.9"
    }
  },
  "deploy": {
    "startCommand": "gunicorn fouronesysERP.wsgi:application --bind 0.0.0.0:$PORT"
  }
}
```

### **2. Docker**  
```dockerfile
FROM python:3.9
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["gunicorn", "fouronesysERP.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## **📊 Diagramas de Arquitectura**  

### **Flujo de Facturación**  
```mermaid
sequenceDiagram
    Cliente->>+Ventas: Solicita factura
    Ventas->>+Inventario: Verifica stock
    Inventario-->>-Ventas: Confirma
    Ventas->>+Contabilidad: Registra transacción
    Contabilidad-->>-Cliente: Emite factura
```

---

## **📝 Guía de Contribución**  
1. Haz fork del repositorio  
2. Crea una rama: `git checkout -b mi-feature`  
3. Sigue el estándar de código PEP 8  
4. Envía tu PR con una descripción clara  

---

## **📞 Soporte**  
Para reportar bugs o solicitar features:  
📧 **info@fourone.com.do**  
🔗 [Issues en GitHub](https://github.com/fouronesys/fouronesysERP/issues)  

---

**© 2025 Four One Solutions** - [Visitar sitio web](https://fourone.com.do)  

*Documentación generada el 26/06/2025*
