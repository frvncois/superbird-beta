import type { SiteSettings } from '@/types/canvas'

export function createDefaultSiteSettings(): SiteSettings {
  return {
    identity: {
      title: 'My Website',
      tagline: 'A website built with Superbird',
    },
    seo: {
      titleFormat: '%page_title% | %site_title%',
      metaDescription: '',
      robotsNoIndex: false,
      robotsNoFollow: false,
    },
    customCode: {
      headCode: '',
      bodyStartCode: '',
      bodyEndCode: '',
      customCss: '',
    },
    redirects: [],
    integrations: {
      customFonts: [],
    },
  }
}
