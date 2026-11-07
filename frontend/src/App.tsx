import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { RequireRole } from './components/RequireRole'
import MenuPage from './pages/MenuPage'
import OrderStatusPage from './pages/OrderStatusPage'
import { ScanPage } from './pages/ScanPage'
import AdminCategoriesPage from './pages/staff/admin/AdminCategoriesPage'
import AdminDashboardPage from './pages/staff/admin/AdminDashboardPage'
import AdminDishesPage from './pages/staff/admin/AdminDishesPage'
import AdminIngredientsPage from './pages/staff/admin/AdminIngredientsPage'
import AdminOrdersPage from './pages/staff/admin/AdminOrdersPage'
import AdminSettingsPage from './pages/staff/admin/AdminSettingsPage'
import AdminTablesPage from './pages/staff/admin/AdminTablesPage'
import AdminUsersPage from './pages/staff/admin/AdminUsersPage'
import KitchenPage from './pages/staff/KitchenPage'
import LoginPage from './pages/staff/LoginPage'
import WaiterPage from './pages/staff/WaiterPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScanPage />} />
        <Route path="/menu/:tenantId" element={<MenuPage />} />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/kitchen"
          element={
            <RequireRole roles={['ADMIN', 'KITCHEN', 'STAFF']}>
              <KitchenPage />
            </RequireRole>
          }
        />
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
    </BrowserRouter>
  )
}
