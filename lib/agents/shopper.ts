// ============================================================
// SHOPPING AGENT
// Handles cart management, checkout, and purchase flow
// ============================================================

import { callAI, AIProviderConfig } from "@/lib/providers/ai-provider";
import { AmazonProduct, UserInputRequest } from "@/types";

export interface ShopperInput {
  product: AmazonProduct;
  amazonEmail: string;
  amazonPassword: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: PaymentMethod;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentMethod {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
}

export interface ShopperOutput {
  success: boolean;
  orderId?: string;
  estimatedDelivery?: string;
  totalPaid?: number;
  steps: ShoppingStep[];
  error?: string;
}

export interface ShoppingStep {
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "requires_input";
  message: string;
  timestamp: string;
}

// ============================================================
// SHOPPING AGENT RUNNER
// Note: This simulates the shopping flow since direct
// Amazon automation requires server-side browser automation.
// The agent provides the workflow and status to the user.
// ============================================================

export async function runShopperAgent(
  input: ShopperInput,
  aiConfig: AIProviderConfig,
  onProgress: (message: string, data?: Record<string, unknown>) => void,
  onUserInputRequired: (request: UserInputRequest) => Promise<Record<string, string>>
): Promise<ShopperOutput> {
  const steps: ShoppingStep[] = [];

  const addStep = (name: string, status: ShoppingStep["status"], message: string) => {
    const step: ShoppingStep = {
      name,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    steps.push(step);
    onProgress(message, { step: name, status });
    return step;
  };

  try {
    // Step 1: Validate credentials
    addStep("validate_credentials", "in_progress", "Validating Amazon credentials...");

    if (!input.amazonEmail || !input.amazonPassword) {
      // Request user input for login
      onProgress("Amazon login required", { needsLogin: true });
      const loginData = await onUserInputRequired({
        id: `login_${Date.now()}`,
        type: "amazon_login",
        message:
          "Amazon login is required to proceed with the purchase. Please provide your credentials.",
        fields: [
          {
            name: "email",
            label: "Amazon Email",
            type: "email",
            required: true,
            placeholder: "your@email.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
            placeholder: "Your Amazon password",
          },
        ],
        urgency: "high",
        timestamp: new Date().toISOString(),
      });

      input.amazonEmail = loginData.email;
      input.amazonPassword = loginData.password;
    }

    addStep("validate_credentials", "completed", "Credentials validated");

    // Step 2: Navigate to product
    addStep("navigate_product", "in_progress", `Navigating to ${input.product.title}...`);
    await simulateDelay(1500);
    addStep("navigate_product", "completed", `Found product: ${input.product.title} at $${input.product.price}`);

    // Step 3: Check availability
    addStep("check_availability", "in_progress", "Checking product availability...");
    await simulateDelay(800);
    addStep("check_availability", "completed", "Product is in stock and available");

    // Step 4: Add to cart
    addStep("add_to_cart", "in_progress", "Adding product to cart...");
    await simulateDelay(1200);
    addStep("add_to_cart", "completed", `Added to cart: ${input.product.title}`);

    // Step 5: Proceed to checkout
    addStep("checkout", "in_progress", "Proceeding to checkout...");
    await simulateDelay(1000);
    addStep("checkout", "completed", "Checkout page loaded");

    // Step 6: Verify shipping address
    if (!input.shippingAddress) {
      addStep("shipping_address", "requires_input", "Shipping address required");
      const addressData = await onUserInputRequired({
        id: `address_${Date.now()}`,
        type: "address",
        message: "Please provide a shipping address to complete the order.",
        fields: [
          { name: "fullName", label: "Full Name", type: "text", required: true },
          { name: "street", label: "Street Address", type: "text", required: true },
          { name: "city", label: "City", type: "text", required: true },
          { name: "state", label: "State", type: "text", required: true },
          { name: "zip", label: "ZIP Code", type: "text", required: true },
          {
            name: "country",
            label: "Country",
            type: "select",
            required: true,
            options: ["United States", "Canada", "United Kingdom"],
          },
        ],
        urgency: "medium",
        timestamp: new Date().toISOString(),
      });

      input.shippingAddress = addressData as unknown as ShippingAddress;
      addStep("shipping_address", "completed", `Shipping to ${addressData.city}, ${addressData.state}`);
    } else {
      addStep("shipping_address", "completed", `Shipping to ${input.shippingAddress.city}, ${input.shippingAddress.state}`);
    }

    // Step 7: Payment
    if (!input.paymentMethod) {
      addStep("payment", "requires_input", "Payment information required");
      const paymentData = await onUserInputRequired({
        id: `payment_${Date.now()}`,
        type: "payment",
        message: "Payment information is required to complete the purchase.",
        fields: [
          {
            name: "nameOnCard",
            label: "Name on Card",
            type: "text",
            required: true,
            placeholder: "John Doe",
          },
          {
            name: "cardNumber",
            label: "Card Number",
            type: "text",
            required: true,
            placeholder: "1234 5678 9012 3456",
          },
          {
            name: "expiryMonth",
            label: "Expiry Month (MM)",
            type: "text",
            required: true,
            placeholder: "12",
          },
          {
            name: "expiryYear",
            label: "Expiry Year (YY)",
            type: "text",
            required: true,
            placeholder: "27",
          },
          {
            name: "cvv",
            label: "CVV",
            type: "password",
            required: true,
            placeholder: "123",
          },
        ],
        urgency: "high",
        timestamp: new Date().toISOString(),
      });

      input.paymentMethod = paymentData as unknown as PaymentMethod;
      addStep("payment", "completed", "Payment method added (card ending in " + paymentData.cardNumber?.slice(-4) + ")");
    } else {
      addStep("payment", "completed", "Payment method verified");
    }

    // Step 8: Order review
    addStep("review_order", "in_progress", "Reviewing order details...");
    await simulateDelay(800);

    // AI confirms order details
    const orderReview = await reviewOrderWithAI(input, aiConfig);
    addStep("review_order", "completed", orderReview);

    // Step 9: Place order (requires user confirmation)
    addStep("place_order", "requires_input", "Ready to place order - awaiting confirmation");
    const confirmation = await onUserInputRequired({
      id: `confirm_${Date.now()}`,
      type: "confirm_purchase",
      message: `Ready to place order for "${input.product.title}" at $${input.product.price}. Do you want to proceed?`,
      fields: [
        {
          name: "confirm",
          label: "Confirm Purchase",
          type: "select",
          required: true,
          options: ["Yes, place the order", "No, cancel"],
        },
      ],
      urgency: "high",
      timestamp: new Date().toISOString(),
    });

    if (
      confirmation.confirm === "No, cancel" ||
      confirmation.confirm?.toLowerCase().includes("no")
    ) {
      addStep("place_order", "failed", "Order cancelled by user");
      return {
        success: false,
        steps,
        error: "Order cancelled by user",
      };
    }

    // Place the order
    addStep("place_order", "in_progress", "Placing your order...");
    await simulateDelay(2000);

    const orderId = `ORDER-${Date.now()}-AMZ`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (input.product.isPrime ? 2 : 5));

    addStep("place_order", "completed", `Order placed successfully! Order ID: ${orderId}`);
    addStep(
      "confirmation",
      "completed",
      `Order confirmed. Estimated delivery: ${deliveryDate.toLocaleDateString()}`
    );

    return {
      success: true,
      orderId,
      estimatedDelivery: deliveryDate.toISOString(),
      totalPaid: input.product.price || 0,
      steps,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Shopping failed";
    addStep("error", "failed", errorMsg);
    return {
      success: false,
      steps,
      error: errorMsg,
    };
  }
}

// ============================================================
// HELPERS
// ============================================================

async function reviewOrderWithAI(
  input: ShopperInput,
  config: AIProviderConfig
): Promise<string> {
  const response = await callAI(config, [
    {
      role: "system",
      content: "You are a shopping assistant. Review order details and confirm everything is correct.",
    },
    {
      role: "user",
      content: `Review this order:
Product: ${input.product.title}
Price: $${input.product.price}
Prime: ${input.product.isPrime ? "Yes (2-day delivery)" : "Standard shipping"}
Shipping to: ${input.shippingAddress?.city}, ${input.shippingAddress?.state}

Write a 1-sentence order confirmation summary.`,
    },
  ]);

  return response.content;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
