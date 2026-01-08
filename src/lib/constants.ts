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
