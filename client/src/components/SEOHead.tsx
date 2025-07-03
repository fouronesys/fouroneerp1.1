import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
}

export function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonicalUrl, 
  ogImage = "https://fourone.com.do/social-preview.png",
  structuredData 
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update keywords if provided
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Update canonical URL if provided
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta) {
      ogImageMeta.setAttribute('content', ogImage);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && canonicalUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
    
    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }
    
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', ogImage);
    }
    
    // Add structured data if provided
    if (structuredData) {
      let structuredDataScript = document.querySelector('#seo-structured-data');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        structuredDataScript.setAttribute('id', 'seo-structured-data');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(structuredData);
    }
    
  }, [title, description, keywords, canonicalUrl, ogImage, structuredData]);

  return null;
}

// Predefined SEO configurations for major pages
export const SEOConfigs = {
  billing: {
    title: "Facturación NCF Automática DGII - Four One Solutions | Sistema ERP República Dominicana",
    description: "Sistema de facturación NCF automática 100% compatible con DGII República Dominicana. Generación automática de comprobantes fiscales, cálculo ITBIS, secuencias NCF y reportes 606/607. Prueba gratis.",
    keywords: "facturación ncf automática, dgii república dominicana, comprobantes fiscales, itbis automático, secuencias ncf, reportes 606 607 dgii, facturación electrónica rd, sistema facturación dominicana",
    canonicalUrl: "https://fourone.com.do/billing",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Sistema Facturación NCF DGII",
      "applicationCategory": "Business Software",
      "description": "Sistema de facturación automática con NCF para cumplimiento DGII en República Dominicana",
      "operatingSystem": "Web, Windows, Android",
      "offers": {
        "@type": "Offer",
        "price": "3500",
        "priceCurrency": "DOP"
      }
    }
  },
  
  pos: {
    title: "Sistema POS Restaurantes República Dominicana - Impresión Térmica | Four One Solutions",
    description: "Sistema POS especializado para restaurantes dominicanos con impresión térmica 58mm/80mm, facturación NCF automática, gestión de mesas, comandas digitales y reportes de ventas en tiempo real.",
    keywords: "pos restaurante república dominicana, sistema punto venta rd, impresión térmica 58mm 80mm, pos restaurante santo domingo, comandas digitales, facturación restaurante ncf, pos offline dominicana",
    canonicalUrl: "https://fourone.com.do/pos",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Sistema POS Restaurantes",
      "applicationCategory": "Point of Sale Software",
      "description": "Sistema punto de venta especializado para restaurantes en República Dominicana",
      "featureList": [
        "Impresión térmica 58mm y 80mm",
        "Facturación NCF automática",
        "Gestión de mesas y comandas",
        "Reportes de ventas en tiempo real"
      ]
    }
  },
  
  inventory: {
    title: "Sistema Inventario Inteligente República Dominicana - Gestión Stock Tiempo Real | Four One ERP",
    description: "Sistema de inventario inteligente para empresas dominicanas con control de stock en tiempo real, alertas automáticas, códigos de barras, múltiples almacenes y reportes avanzados. Integrado con facturación NCF.",
    keywords: "sistema inventario república dominicana, gestión stock tiempo real, control inventario rd, códigos barras dominicana, almacenes múltiples, inventario automático, stock alert dominicana",
    canonicalUrl: "https://fourone.com.do/inventory",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Sistema Gestión Inventario",
      "applicationCategory": "Inventory Management Software",
      "description": "Sistema de gestión de inventarios inteligente para empresas en República Dominicana"
    }
  },
  
  accounting: {
    title: "Contabilidad Automatizada DGII República Dominicana - Reportes 606/607 | Four One Solutions",
    description: "Sistema contabilidad automatizada compatible con DGII República Dominicana. Generación automática reportes 606, 607, libro diario, balance general, estados financieros y declaraciones fiscales.",
    keywords: "contabilidad automatizada dgii, reportes 606 607 dominicana, sistema contable rd, declaraciones fiscales automáticas, balance general dominicana, estados financieros dgii, contabilidad empresarial rd",
    canonicalUrl: "https://fourone.com.do/accounting",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Sistema Contabilidad DGII",
      "applicationCategory": "Accounting Software",
      "description": "Sistema de contabilidad automatizada para cumplimiento DGII en República Dominicana"
    }
  },
  
  reports: {
    title: "Reportes DGII Automatizados República Dominicana - Formatos 606/607 | Four One ERP",
    description: "Generación automática de reportes DGII República Dominicana: formatos 606, 607, declaraciones informativas, reportes de compras/ventas. Cumplimiento 100% con normativas fiscales dominicanas.",
    keywords: "reportes dgii automatizados, formato 606 607 dominicana, declaraciones informativas dgii, reportes fiscales rd, cumplimiento tributario dominicana, dgii república dominicana reportes",
    canonicalUrl: "https://fourone.com.do/reports",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Reportes DGII Automatizados",
      "applicationCategory": "Tax Reporting Software",
      "description": "Generación automática de reportes fiscales para DGII República Dominicana"
    }
  }
};