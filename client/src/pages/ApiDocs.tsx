import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Code2, Database, Shield, CheckCircle } from "lucide-react";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Documentación API
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                APIs gratuitas para desarrolladores - Validación RNC y más
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/api-registration">
                <Code2 className="h-4 w-4 mr-2" />
                Obtener API Key
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Introducción</TabsTrigger>
            <TabsTrigger value="auth">Autenticación</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Ejemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Bienvenido a Four One API
                  </CardTitle>
                  <CardDescription>
                    Accede a servicios de validación fiscal y consultas empresariales para República Dominicana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Seguro</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        API keys únicas por desarrollador
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Confiable</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Datos actualizados de DGII
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Code2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Fácil</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        RESTful API con JSON
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Base URL</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                      https://your-domain.fourone.com.do/api/v1
                    </div>
                    
                    <h3 className="text-lg font-semibold">Servicios Disponibles</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary">GET</Badge>
                        <span>Validación de RNC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary">GET</Badge>
                        <span>Consulta de datos empresariales</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary">GET</Badge>
                        <span>Tipos de NCF disponibles</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Getting Started Card */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    ¿Listo para comenzar?
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Obtén tu API key gratuita y comienza a integrar nuestros servicios en minutos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Pasos para empezar:
                      </h4>
                      <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>1. Regístrate y obtén tu API key</li>
                        <li>2. Revisa los endpoints disponibles</li>
                        <li>3. Prueba con los ejemplos de código</li>
                        <li>4. Integra en tu aplicación</li>
                      </ol>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/api-registration">
                          Obtener API Key Gratis
                        </Link>
                      </Button>
                      <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                        Sin límites • Sin costos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Autenticación</CardTitle>
                <CardDescription>
                  Todas las llamadas a la API requieren autenticación mediante API Key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Obtener API Key</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Para obtener tu API Key, debes registrarte como desarrollador.
                  </p>
                  <Button asChild>
                    <Link href="/api-register">Registrarse como Desarrollador</Link>
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Usar API Key</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Incluye tu API Key en el header Authorization de cada petición:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="text-sm">
{`Authorization: Bearer tu-api-key-aqui

// Ejemplo con curl
curl -H "Authorization: Bearer tu-api-key-aqui" \\
     https://api.example.com/v1/rnc/validate/123456789

// Ejemplo con JavaScript
fetch('https://api.example.com/v1/rnc/validate/123456789', {
  headers: {
    'Authorization': 'Bearer tu-api-key-aqui'
  }
})`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Códigos de Error</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 border rounded">
                      <span className="font-mono">401</span>
                      <span>API Key inválida o faltante</span>
                    </div>
                    <div className="flex justify-between p-2 border rounded">
                      <span className="font-mono">403</span>
                      <span>API Key desactivada</span>
                    </div>
                    <div className="flex justify-between p-2 border rounded">
                      <span className="font-mono">429</span>
                      <span>Límite de peticiones excedido</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge>GET</Badge>
                    Validar RNC
                  </CardTitle>
                  <CardDescription>
                    Valida un RNC contra el registro de la DGII
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Endpoint</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                        GET /api/v1/rnc/validate/{'{rnc}'}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Parámetros</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="text-left p-3">Parámetro</th>
                              <th className="text-left p-3">Tipo</th>
                              <th className="text-left p-3">Descripción</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="p-3 font-mono">rnc</td>
                              <td className="p-3">string</td>
                              <td className="p-3">RNC a validar (9-11 dígitos)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Respuesta Exitosa (200)</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`{
  "success": true,
  "data": {
    "rnc": "123456789",
    "razonSocial": "EMPRESA EJEMPLO SRL",
    "nombreComercial": "Empresa Ejemplo",
    "categoria": "RÉGIMEN ORDINARIO",
    "regimen": "PERSONA JURÍDICA",
    "estado": "ACTIVO"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge>GET</Badge>
                    Tipos de NCF
                  </CardTitle>
                  <CardDescription>
                    Obtiene la lista de tipos de NCF disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Endpoint</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                        GET /api/v1/ncf/types
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Respuesta Exitosa (200)</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`{
  "success": true,
  "data": [
    {
      "codigo": "01",
      "descripcion": "Factura de Crédito Fiscal",
      "tipo": "venta"
    },
    {
      "codigo": "02", 
      "descripcion": "Factura de Consumo",
      "tipo": "venta"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ejemplos de Uso</CardTitle>
                  <CardDescription>
                    Ejemplos prácticos en diferentes lenguajes de programación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="javascript" className="w-full">
                    <TabsList>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="php">PHP</TabsTrigger>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="javascript">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`// Validar RNC con JavaScript
async function validateRNC(rnc) {
  const response = await fetch(\`https://api.example.com/v1/rnc/validate/\${rnc}\`, {
    headers: {
      'Authorization': 'Bearer tu-api-key-aqui',
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('RNC válido:', data.data.razonSocial);
  } else {
    console.log('RNC inválido:', data.message);
  }
}

// Uso
validateRNC('123456789');`}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="python">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`import requests

def validate_rnc(rnc):
    url = f"https://api.example.com/v1/rnc/validate/{rnc}"
    headers = {
        'Authorization': 'Bearer tu-api-key-aqui',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    if data['success']:
        print(f"RNC válido: {data['data']['razonSocial']}")
    else:
        print(f"RNC inválido: {data['message']}")

# Uso
validate_rnc('123456789')`}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="php">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`<?php
function validateRNC($rnc) {
    $url = "https://api.example.com/v1/rnc/validate/" . $rnc;
    
    $headers = [
        'Authorization: Bearer tu-api-key-aqui',
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "RNC válido: " . $data['data']['razonSocial'];
    } else {
        echo "RNC inválido: " . $data['message'];
    }
}

// Uso
validateRNC('123456789');
?>`}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="curl">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm">
{`# Validar RNC
curl -X GET \\
  "https://api.example.com/v1/rnc/validate/123456789" \\
  -H "Authorization: Bearer tu-api-key-aqui" \\
  -H "Content-Type: application/json"

# Obtener tipos de NCF  
curl -X GET \\
  "https://api.example.com/v1/ncf/types" \\
  -H "Authorization: Bearer tu-api-key-aqui" \\
  -H "Content-Type: application/json"`}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}