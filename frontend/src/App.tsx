import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationLoaderProvider } from "@/contexts/NavigationLoaderContext";
import RequireSeller from "@/components/auth/RequireSeller";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import RequireMarketer from "@/components/auth/RequireMarketer";
import RequireSupportAccess from "@/components/auth/RequireSupportAccess";
import PageTransitionBar from "@/components/ui/PageTransitionBar";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSellers from "./pages/AdminSellers";
import AdminSellerProfile from "./pages/AdminSellerProfile";
import MarketerDashboard from "./pages/MarketerDashboard";
import CheckoutDelivery from "./pages/CheckoutDelivery";
import CheckoutReview from "./pages/CheckoutReview";
import CheckoutPayment from "./pages/CheckoutPayment";
import ForgotPassword from "./pages/ForgotPassword";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderInvoice from "./pages/OrderInvoice";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ProductPricing from "./pages/ProductPricing";
import OrderConfirmed from "./pages/OrderConfirmed";
import SupportDashboard from "./pages/support/SupportDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <NavigationLoaderProvider>
              <PageTransitionBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/account"
                  element={
                    <RequireAuth>
                      <Account />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <RequireAuth>
                      <Orders />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <RequireAuth>
                      <OrderDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/orders/:id/invoice"
                  element={
                    <RequireAuth>
                      <OrderInvoice />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/order-confirmed"
                  element={
                    <RequireAuth>
                      <OrderConfirmed />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/checkout/delivery"
                  element={
                    <RequireAuth>
                      <CheckoutDelivery />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/checkout/review"
                  element={
                    <RequireAuth>
                      <CheckoutReview />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/checkout/payment"
                  element={
                    <RequireAuth>
                      <CheckoutPayment />
                    </RequireAuth>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsConditions />} />
                <Route path="/product-prices" element={<ProductPricing />} />
                <Route
                  path="/seller"
                  element={
                    <RequireSeller>
                      <SellerDashboard />
                    </RequireSeller>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminDashboard />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/sellers"
                  element={
                    <RequireAdmin>
                      <AdminSellers />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/sellers/:id"
                  element={
                    <RequireAdmin>
                      <AdminSellerProfile />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/marketer"
                  element={
                    <RequireMarketer>
                      <MarketerDashboard />
                    </RequireMarketer>
                  }
                />
                <Route
                  path="/support"
                  element={
                    <RequireSupportAccess>
                      <SupportDashboard />
                    </RequireSupportAccess>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NavigationLoaderProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;