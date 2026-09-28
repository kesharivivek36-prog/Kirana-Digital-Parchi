/**
 * Default sample grocery items and mock orders for Digital Parchi
 */

const SAMPLE_GROCERY_TEMPLATES = [
  "1. Aashirvaad Atta - 5 Kg\n2. Tata Salt - 1 Packet\n3. Amul Butter - 100 g\n4. Fortune Sunflower Oil - 1 Litre\n5. Maggi - 4 Packets",
  "1. Aashirvaad Shudh Chakki Atta - 5kg\n2. Tata Salt - 1 packet (1kg)\n3. Fortune Sunlite Sunflower Oil - 1 Litre pouch\n4. Amul Taaza Milk - 2 packets (500ml)\n5. Maggi 2-Minute Noodles - 4 packs\n6. Tata Tea Premium - 250g\n7. Surf Excel Easy Wash Detergent - 1kg",
  "1. Basmati Rice (Daawat) - 2kg\n2. Toor Dal (Desi) - 1kg\n3. Chana Dal - 500g\n4. MDH Garam Masala - 1 small box\n5. Dettol Handwash Refill - 1 pouch\n6. Vim Dishwash Bar - 2 pcs",
  "1. Sugar (Madhur) - 3kg\n2. Amul Butter - 100g\n3. Britannia Good Day Cookies - 2 packs\n4. Kissan Fresh Tomato Ketchup - 500g\n5. Haldiram Bhujia - 400g"
];

const INITIAL_MOCK_ORDERS = [
  {
    id: "DP-1001",
    customerName: "Rajesh Kumar",
    customerPhone: "9876543210",
    orderType: "pickup",
    pickupTime: "Today at 7:30 PM",
    deliveryAddress: "",
    specialNotes: "Please pack everything in double paper bags if possible.",
    items: [
      { id: "item-1", name: "Aashirvaad Shudh Chakki Atta", quantity: "5 kg", packed: true },
      { id: "item-2", name: "Fortune Sunlite Oil", quantity: "1 Litre", packed: true },
      { id: "item-3", name: "Tata Salt", quantity: "1 packet", packed: false },
      { id: "item-4", name: "Madhur Pure & Hygienic Sugar", quantity: "2 kg", packed: false }
    ],
    rawText: "1. Aashirvaad Shudh Chakki Atta - 5 kg\n2. Fortune Sunlite Oil - 1 Litre\n3. Tata Salt - 1 packet\n4. Madhur Pure & Hygienic Sugar - 2 kg",
    status: "pending",
    billAmount: "560",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 mins ago
  },
  {
    id: "DP-1002",
    customerName: "Sunita Sharma",
    customerPhone: "9823456781",
    orderType: "delivery",
    pickupTime: "",
    deliveryAddress: "Flat 402, Shivam Apartments, Near Temple, Main Market Road",
    specialNotes: "Please deliver before 8:00 PM. Call before arriving.",
    items: [
      { id: "item-5", name: "Amul Taaza Milk", quantity: "2 packets (500ml)", packed: true },
      { id: "item-6", name: "Tata Gold Tea", quantity: "250g", packed: true },
      { id: "item-7", name: "Maggi 2-Minute Masala Noodles", quantity: "4 packs", packed: false },
      { id: "item-8", name: "Haldiram Aloo Bhujia", quantity: "200g", packed: false }
    ],
    rawText: "1. Amul Taaza Milk - 2 packets (500ml)\n2. Tata Gold Tea - 250g\n3. Maggi 2-Minute Masala Noodles - 4 packs\n4. Haldiram Aloo Bhujia - 200g",
    status: "packing",
    billAmount: "345",
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString() // 55 mins ago
  },
  {
    id: "DP-1003",
    customerName: "Vikram Malhotra",
    customerPhone: "9711223344",
    orderType: "pickup",
    pickupTime: "Ready to pick anytime",
    deliveryAddress: "",
    specialNotes: "All items verified.",
    items: [
      { id: "item-9", name: "India Gate Basmati Rice", quantity: "5 kg", packed: true },
      { id: "item-10", name: "Toor Dal", quantity: "1 kg", packed: true },
      { id: "item-11", name: "Everest Turmeric Powder", quantity: "100g", packed: true },
      { id: "item-12", name: "Surf Excel Detergent Bar", quantity: "4 pcs", packed: true }
    ],
    rawText: "1. India Gate Basmati Rice - 5 kg\n2. Toor Dal - 1 kg\n3. Everest Turmeric Powder - 100g\n4. Surf Excel Detergent Bar - 4 pcs",
    status: "completed",
    billAmount: "820",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  }
];
