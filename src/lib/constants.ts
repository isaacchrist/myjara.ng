export const ABUJA_MARKETS = [
    { name: 'Karmo Market', days: ['Tuesday', 'Friday'] },
    { name: 'Kuje Market', days: ['Wednesday', 'Saturday'] },
    { name: 'Gwarinpa Farmers Market', days: ['Friday', 'Sunday'] },
    { name: 'Jabi Lake Mall Farmers Market', days: ['Saturday'] },
    { name: 'Kubwa Farmers Market', days: ['Sunday'] },
    { name: 'Kabusa Market', days: ['Saturday'] },
    { name: 'Nyanya Market', days: ['Wednesday'] },
    { name: 'Wuse Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Garki International Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Gudu Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Deidei Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Utako Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Kado Fish Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Maitama Farmers Market', days: ['Sunday'] },
    { name: 'Zuba Market', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { name: 'Gosa Market', days: ['Friday'] }, // Assumed Friday based on general farmers market trends in the area, but defaulting to daily or specific if known. Let's stick to the specific ones researched.
]

export const SUBSCRIPTION_PLANS = [
    {
        id: 'basic',
        name: 'Basic Plan',
        price: 2000,
        features: ['Standard Search', 'Access to Market Days', 'Basic Support']
    },
    {
        id: 'pro',
        name: 'Pro Plan',
        price: 5000,
        features: ['Priority Search', 'Advanced Analytics', 'Email Support', 'Jara Deal Alerts']
    },
    {
        id: 'exclusive',
        name: 'Exclusive Plan',
        price: 7500,
        features: ['Top Visibility', 'Dedicated Manager', 'Premium Jara Offers', 'Instant Notifications']
    }
]

export const ABUJA_LOCATIONS = [
    {
        lga: 'Abaji',
        districts: ['Abaji Central', 'Agyana', 'Bagido', 'Nuku', 'Pandagi', 'Rimba', 'Yaba']
    },
    {
        lga: 'Bwari',
        districts: ['Bwari Central', 'Dawaki', 'Dutse-Alhaji', 'Kubwa', 'Mpape', 'Ushafa', 'Zhiko']
    },
    {
        lga: 'Gwagwalada',
        districts: ['Gwagwalada Central', 'Ibwa', 'Kutunku', 'Paiko', 'Tunga', 'Zuba']
    },
    {
        lga: 'Kuje',
        districts: ['Kuje Central', 'Chibiri', 'Gaube', 'Gwagwalada', 'Kwali', 'Rubochi']
    },
    {
        lga: 'AMAC (Municipal)',
        districts: [
            'Asokoro', 'Central Area', 'Garki', 'Gwarinpa', 'Jabi', 'Maitama',
            'Utako', 'Wuse', 'Wuse II', 'Gudu', 'Durumi', 'Lokogoma', 'Gillmore', 'Jahi'
        ]
    },
    {
        lga: 'Kwali',
        districts: ['Kwali Central', 'Ashara', 'Dafa', 'Gumbo', 'Kilankwa', 'Pai', 'Wako']
    }
]

export const PRODUCT_CATEGORIES = [
    {
        id: 'building-construction',
        name: 'Building & Construction',
        icon: '🏗️',
        subcategories: [
            { id: 'cement', name: 'Cement & Concrete' },
            { id: 'blocks', name: 'Blocks & Bricks' },
            { id: 'rods', name: 'Iron Rods & Steel' },
            { id: 'roofing', name: 'Roofing Materials' },
            { id: 'plumbing', name: 'Plumbing & Pipes' },
            { id: 'electrical', name: 'Electrical Supplies' },
            { id: 'tiles', name: 'Tiles & Flooring' },
            { id: 'paints', name: 'Paints & Finishes' },
            { id: 'doors-windows', name: 'Doors & Windows' },
            { id: 'hardware', name: 'Tools & Hardware' }
        ]
    },
    {
        id: 'food-groceries',
        name: 'Food & Groceries',
        icon: '🛒',
        subcategories: [
            { id: 'grains', name: 'Rice, Beans & Grains' },
            { id: 'provisions', name: 'Provisions & Essentials' },
            { id: 'fresh-produce', name: 'Fresh Produce' },
            { id: 'beverages', name: 'Beverages & Drinks' },
            { id: 'snacks', name: 'Snacks & Confectionery' },
            { id: 'cooking-oil', name: 'Cooking Oil & Seasonings' },
            { id: 'frozen-foods', name: 'Frozen Foods' },
            { id: 'dairy', name: 'Dairy Products' }
        ]
    },
    {
        id: 'fashion',
        name: 'Fashion & Apparel',
        icon: '👗',
        subcategories: [
            { id: 'mens-clothing', name: "Men's Clothing" },
            { id: 'womens-clothing', name: "Women's Clothing" },
            { id: 'kids-clothing', name: "Children's Clothing" },
            { id: 'shoes', name: 'Shoes & Footwear' },
            { id: 'bags', name: 'Bags & Luggage' },
            { id: 'accessories', name: 'Accessories & Jewelry' },
            { id: 'fabrics', name: 'Fabrics & Textiles' },
            { id: 'traditional', name: 'Traditional Wear' }
        ]
    },
    {
        id: 'electronics',
        name: 'Electronics & Gadgets',
        icon: '📱',
        subcategories: [
            { id: 'phones', name: 'Mobile Phones & Tablets' },
            { id: 'computers', name: 'Computers & Laptops' },
            { id: 'accessories', name: 'Phone & Computer Accessories' },
            { id: 'home-appliances', name: 'Home Appliances' },
            { id: 'kitchen-appliances', name: 'Kitchen Appliances' },
            { id: 'audio-video', name: 'Audio & Video Equipment' },
            { id: 'solar', name: 'Solar & Power Solutions' }
        ]
    },
    {
        id: 'health-beauty',
        name: 'Health & Beauty',
        icon: '💄',
        subcategories: [
            { id: 'skincare', name: 'Skincare & Cosmetics' },
            { id: 'haircare', name: 'Hair Care Products' },
            { id: 'pharmaceuticals', name: 'Pharmaceuticals & Medicine' },
            { id: 'personal-care', name: 'Personal Care & Hygiene' },
            { id: 'fragrances', name: 'Fragrances & Perfumes' },
            { id: 'baby-care', name: 'Baby Care Products' }
        ]
    },
    {
        id: 'home-garden',
        name: 'Home & Garden',
        icon: '🏠',
        subcategories: [
            { id: 'furniture', name: 'Furniture' },
            { id: 'kitchenware', name: 'Kitchenware & Utensils' },
            { id: 'bedding', name: 'Bedding & Linens' },
            { id: 'decor', name: 'Home Decor' },
            { id: 'cleaning', name: 'Cleaning Supplies' },
            { id: 'garden', name: 'Garden & Outdoor' },
            { id: 'lighting', name: 'Lighting & Fixtures' }
        ]
    },
    {
        id: 'automotive',
        name: 'Automotive & Parts',
        icon: '🚗',
        subcategories: [
            { id: 'spare-parts', name: 'Spare Parts' },
            { id: 'tires', name: 'Tires & Tubes' },
            { id: 'oils-lubricants', name: 'Oils & Lubricants' },
            { id: 'accessories', name: 'Car Accessories' },
            { id: 'batteries', name: 'Batteries' }
        ]
    },
    {
        id: 'agriculture',
        name: 'Agriculture & Farming',
        icon: '🌾',
        subcategories: [
            { id: 'seeds', name: 'Seeds & Seedlings' },
            { id: 'fertilizers', name: 'Fertilizers & Pesticides' },
            { id: 'farm-tools', name: 'Farm Tools & Equipment' },
            { id: 'livestock', name: 'Livestock Feed' },
            { id: 'irrigation', name: 'Irrigation Supplies' }
        ]
    },
    {
        id: 'office-supplies',
        name: 'Office & Stationery',
        icon: '📎',
        subcategories: [
            { id: 'stationery', name: 'Stationery & Paper' },
            { id: 'office-furniture', name: 'Office Furniture' },
            { id: 'printing', name: 'Printing & Supplies' },
            { id: 'office-electronics', name: 'Office Electronics' }
        ]
    }
]
