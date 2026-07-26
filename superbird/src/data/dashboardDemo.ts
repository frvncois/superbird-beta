// Placeholder dashboard data. Swap for real analytics / form / commerce
// sources once those backends exist.

export interface AnalyticsPoint {
  label: string
  value: number
}

export const analytics = {
  visitors: 12480,
  changePct: 12.4,
  // Last 7 days of visitors.
  series: [
    { label: 'Mon', value: 1420 },
    { label: 'Tue', value: 1680 },
    { label: 'Wed', value: 1290 },
    { label: 'Thu', value: 2010 },
    { label: 'Fri', value: 2440 },
    { label: 'Sat', value: 1870 },
    { label: 'Sun', value: 1770 },
  ] as AnalyticsPoint[],
}

// Richer analytics for the "View analytics" detail (still placeholder data).
export const analyticsDetail = {
  stats: [
    { label: 'Visitors', value: '12,480', change: 12.4 },
    { label: 'Page views', value: '38,910', change: 8.1 },
    { label: 'Avg. time', value: '2m 14s', change: -3.2 },
    { label: 'Bounce rate', value: '41%', change: -1.4 },
  ],
  topPages: [
    { path: '/', views: 8420 },
    { path: '/products', views: 5210 },
    { path: '/about', views: 2980 },
    { path: '/blog', views: 2140 },
    { path: '/contact', views: 1360 },
  ],
  sources: [
    { name: 'Direct', pct: 42 },
    { name: 'Google', pct: 31 },
    { name: 'Social', pct: 18 },
    { name: 'Referral', pct: 9 },
  ],
  devices: [
    { name: 'Desktop', pct: 58 },
    { name: 'Mobile', pct: 36 },
    { name: 'Tablet', pct: 6 },
  ],
}

