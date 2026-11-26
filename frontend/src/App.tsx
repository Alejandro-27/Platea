import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { RequireRole } from './components/RequireRole'
import MenuPage from './pages/MenuPage'
import OrderStatusPage from './pages/OrderStatusPage'
import { ScanPage } from './pages/ScanPage'
import { HomePage } from './pages/HomePage'

// El comensal carga su menú sin descargar el panel, zod ni el KDS.
const AdminCategoriesPage = lazy(() => import('./pages/staff/admin/AdminCategoriesPage'))
const AdminDashboardPage = lazy(() => import('./pages/staff/admin/AdminDashboardPage'))
const AdminDishesPage = lazy(() => import('./pages/staff/admin/AdminDishesPage'))
const AdminIngredientsPage = lazy(() => import('./pages/staff/admin/AdminIngredientsPage'))
const AdminOrdersPage = lazy(() => import('./pages/staff/admin/AdminOrdersPage'))
const AdminSettingsPage = lazy(() => import('./pages/staff/admin/AdminSettingsPage'))
const AdminTablesPage = lazy(() => import('./pages/staff/admin/AdminTablesPage'))
const AdminUsersPage = lazy(() => import('./pages/staff/admin/AdminUsersPage'))
const KitchenPage = lazy(() => import('./pages/staff/KitchenPage'))
const LoginPage = lazy(() => import('./pages/staff/LoginPage'))
const WaiterPage = lazy(() => import('./pages/staff/WaiterPage'))

function RouteFallback() {
  const { t } = useTranslation()
  return (
    <p role="status" className="p-6 text-sm text-muted">
      {t('common.loading')}
    </p>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu/:tenantId" element={<MenuPage />} />
          <Route path="/order/:orderId" element={<OrderStatusPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/kds"
            element={
              <RequireRole roles={['ADMIN', 'KITCHEN', 'STAFF']}>
                <KitchenPage />
              </RequireRole>
            }
          />
          <Route path="/kitchen" element={<Navigate to="/kds" replace />} />
          <Route
            path="/waiter"
            element={
              <RequireRole roles={['ADMIN', 'STAFF', 'KITCHEN']}>
                <WaiterPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN']}>
                <Outlet />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="dishes" element={<AdminDishesPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
            <Route path="ingredients" element={<AdminIngredientsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<ScanPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
