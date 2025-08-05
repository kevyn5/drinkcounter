const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPageAdaptive.vue') },
      { path: 'personal-data', component: () => import('pages/PersonalDataPage.vue') },
      { path: 'statistics', component: () => import('pages/StatisticsPageSimple.vue') }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
