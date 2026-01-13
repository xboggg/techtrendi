import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    setIsOpen,
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {totalItems > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalItems} items)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-foreground mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Browse our store and add some digital products!
            </p>
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link to="/store">Browse Store</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-muted/50 rounded-xl"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize mb-2">
                      {item.type}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        ${item.price.toFixed(2)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="lg" asChild>
                  <Link to="/checkout" onClick={() => setIsOpen(false)}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                    asChild
                  >
                    <Link to="/store">Continue Shopping</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={clearCart}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className="text-xs text-muted-foreground">We accept:</span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Visa</div>
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">Mastercard</div>
                  <div className="px-2 py-1 bg-muted rounded text-xs font-medium">PayPal</div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
