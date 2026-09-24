# 🛒 Digital Parchi (डिजिटल पर्ची)
> A modern Kirana Grocery Store web application designed for fast, paperless ordering, order packing management, thermal receipt printing, and customer notifications.

---

## 🌟 Key Features

### 1. 📱 Customer Interface (Order Page)
- **Customer Contact Details**: Full name and 10-digit mobile number validation.
- **Dual Grocery List Input**:
  - **WhatsApp / Free Text Mode**: Large text area where customers can type or paste their grocery list directly (e.g. copied from WhatsApp). Auto-detects item count and includes a **"Paste Sample List"** button for instant testing.
  - **Dynamic Item Builder**: Add items one by one with **Item Name** and **Quantity** (e.g. *Aashirvaad Atta - 5kg*). Includes quick-add chips, live table, and remove controls.
- **Order Fulfillment Types**:
  - **Store Pickup (दुकान से पिकअप)**: Choose pickup time presets (*"In 15 mins"*, *"In 30 mins"*, *"In 1 hour"*, *"Evening 6-8 PM"*) or enter custom time.
  - **Home Delivery (घर पर डिलीवरी)**: Full delivery address and landmark input.
- **Special Instructions**: Optional notes for the shopkeeper (e.g. *"Select ripe bananas"*).
- **Instant Order Confirmation**: Unique Order ID (`#DP-1001`), summary slip, and 1-click button to view the order in the Shopkeeper Dashboard.

### 2. 🏪 Shopkeeper Dashboard
- **Live Metrics Counter**: Real-time counts for **Pending**, **Packing**, **Ready for Pickup**, and **Completed Today**.
- **Incoming Orders Feed**:
  - Displays Customer Name, Mobile Number, Order Type badge, and timestamp.
  - **Click-to-Call** and **WhatsApp** direct contact links.
  - **Interactive Packing Checklist**: Shopkeeper can physically tick off items as they pack them into the bag (strikes through and saves state).
- **Status Workflow Buttons**:
  - **Pending** (Amber)
  - **Packing** (Blue)
  - **Ready for Pickup** (Emerald)
  - **Mark Completed** (Slate)
- **"Ready for Pickup" Modal**:
  - Input field for **Total Bill Amount (₹)**.
  - Pre-filled, customizable SMS message:
    > *"Namaste Rajesh Kumar! Your grocery order #DP-1001 is packed and ready for pickup at Sharma Kirana Store. Total bill: ₹560. Please collect it at your convenience. Thank you!"*
  - **Send SMS (Mock)** button: Logs the message to `console.log` and displays an on-screen toast confirmation.
  - **Open WhatsApp** button: Pre-populates the message in WhatsApp Web/App directly to the customer's phone number.
- **Order History Section**:
  - Dedicated tab to view completed and delivered orders with total bills and items.
- **Print / Share Buttons**:
  - 🖨️ **Print Slip**: Formats a thermal Kirana receipt ("पर्ची") complete with store header, order details, item checklist, total bill, and UPI QR section. Prepares clean `@media print` layout.
  - 📋 **Share**: Formats grocery parchi into clean text with 1-click **Copy to Clipboard** and **Share to WhatsApp**.
- **Local Storage Persistence & Multi-tab Sync**:
  - Orders persist in browser `localStorage`.
  - Changes in one tab automatically sync to any other open tabs in real-time.
- **Audio Chime**:
  - Pleasant 2-tone audio chime on new orders and status updates using Web Audio API (no audio files needed, toggleable ON/OFF).

---

## 🚀 How to Run and Test in Browser

### Method 1: Direct File Open (Zero Setup)
Simply double-click `index.html` or right-click `index.html` and choose **Open with -> Google Chrome / Microsoft Edge / Firefox**.

### Method 2: Local HTTP Server (Optional)
If you prefer running via a local server:

**Using Python:**
```bash
python -m http.server 3000
```
Then open `http://localhost:3000` in your browser.

**Using Node.js:**
```bash
npx serve .
```

---

## 🧪 Testing Walkthrough

1. **Test Pre-loaded Demo Orders**:
   - Open the application. Click **"Shopkeeper Dashboard"** in the top navigation bar.
   - Notice the 3 sample orders loaded across different statuses (*Pending*, *Packing*, *Completed*).
   - Click the items' checkboxes to tick them off as packed.
   - Click **"Ready 🔔"** on a pending or packing order.
   - Enter a bill amount (e.g. `485`) & observe the pre-filled message update dynamically.
   - Click **"Send SMS (Mock)"** & open your browser's Developer Tools (`F12` -> Console) to view the logged mock SMS payload.
   - Click **"Print"** on any card to preview the thermal Kirana receipt slip.

2. **Test Placing a New Customer Order**:
   - Click **"Customer Order"** in the top navigation.
   - Enter your name and 10-digit mobile number.
   - In **WhatsApp / Free Text** mode, click **"Paste Sample List"** (or switch to **Dynamic Item Builder** to add items manually).
   - Select **Store Pickup** or **Home Delivery**.
   - Click **"Submit Order (पर्ची भेजें)"**.
   - A confirmation popup will appear with your new Order ID (e.g., `#DP-1004`).
   - Click **"View in Shopkeeper Dashboard &rarr;"** to see your order appear live at the top of the dashboard!

3. **Resetting Data**:
   - Click **"Reset Demo Data"** at the top right anytime to restore initial sample orders.

---

## 📁 File Structure

```
Kirana-Digital-Parchi/
│
├── index.html            # Main single-page application with Customer & Dashboard views
├── css/
│   └── styles.css        # Thermal receipt layout, print media styles, custom animations
├── js/
│   ├── data.js           # Sample grocery templates and initial mock orders
│   └── app.js            # State management, local storage, form handlers, SMS modal & audio
└── README.md             # Documentation & testing guide
```
