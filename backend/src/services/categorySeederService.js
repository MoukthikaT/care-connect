import ServiceCategory from '../models/ServiceCategory.js';

const DEFAULT_CATEGORIES = [
  {
    name: 'Plumbing Services',
    description: 'Professional plumbing repairs, leak fixes, drain clearing, and fixture installations.',
    icon: 'wrench',
    subcategories: [
      {
        name: 'Pipe & Leak Repair',
        description: 'Diagnose and repair leaking pipes, joint cracks, and water pressure issues.',
        estimatedBasePrice: 499,
        price: 499,
        originalPrice: 699,
        estimatedDuration: '45-60 mins',
        rating: 4.9,
        reviewCount: 142,
        inclusions: ['Pipe inspection', 'Leak sealing', 'Pressure testing'],
        highlights: ['Same-day service', 'Licensed plumbers', '30-day warranty'],
        unit: 'per repair',
        requiredSkills: ['Pipe Repair', 'Leak Detection', 'Plumbing']
      },
      {
        name: 'Drain Unclogging',
        description: 'Clear clogged sinks, showers, toilets, and main drain lines efficiently.',
        estimatedBasePrice: 399,
        price: 399,
        originalPrice: 599,
        estimatedDuration: '30-45 mins',
        rating: 4.8,
        reviewCount: 98,
        inclusions: ['Drain snaking', 'Debris clearing', 'Flow verification'],
        highlights: ['Fast response', 'Safe non-toxic tools'],
        unit: 'per drain',
        requiredSkills: ['Drain Clearing', 'Plumbing']
      },
      {
        name: 'Faucet & Fixture Installation',
        description: 'Install or replace faucets, showerheads, sinks, and vanity fixtures.',
        estimatedBasePrice: 599,
        price: 599,
        originalPrice: 799,
        estimatedDuration: '60 mins',
        rating: 4.9,
        reviewCount: 76,
        inclusions: ['Old fixture removal', 'New fixture mounting', 'Connection testing'],
        highlights: ['Clean finish', 'Leak-proof guarantee'],
        unit: 'per fixture',
        requiredSkills: ['Fixture Installation', 'Plumbing']
      }
    ]
  },
  {
    name: 'Electrical & Wiring',
    description: 'Certified electrical troubleshooting, wiring repairs, lighting, and panel services.',
    icon: 'zap',
    subcategories: [
      {
        name: 'Outlet & Switch Repair',
        description: 'Fix dead outlets, faulty light switches, and flickering connections.',
        estimatedBasePrice: 299,
        price: 299,
        originalPrice: 499,
        estimatedDuration: '30-45 mins',
        rating: 4.9,
        reviewCount: 110,
        inclusions: ['Safety check', 'Receptacle replacement', 'Circuit testing'],
        highlights: ['Licensed electrician', 'Safety guaranteed'],
        unit: 'per outlet',
        requiredSkills: ['Electrical Repair', 'Wiring']
      },
      {
        name: 'Light Fixture & Ceiling Fan Installation',
        description: 'Mount and wire chandeliers, pendant lights, ceiling fans, and smart lighting.',
        estimatedBasePrice: 699,
        price: 699,
        originalPrice: 899,
        estimatedDuration: '60-90 mins',
        rating: 4.8,
        reviewCount: 88,
        inclusions: ['Wiring connection', 'Fixture mounting', 'Operation test'],
        highlights: ['Clean installation', 'Heavy fixture support'],
        unit: 'per fixture',
        requiredSkills: ['Lighting Installation', 'Electrical']
      },
      {
        name: 'Circuit Breaker Troubleshooting',
        description: 'Inspect tripping breakers, electrical panel issues, and overload hazards.',
        estimatedBasePrice: 899,
        price: 899,
        originalPrice: 1199,
        estimatedDuration: '60 mins',
        rating: 5.0,
        reviewCount: 64,
        inclusions: ['Panel inspection', 'Load analysis', 'Breaker replacement'],
        highlights: ['Emergency support', 'Certified safety audit'],
        unit: 'per inspection',
        requiredSkills: ['Breaker Repair', 'Electrical Audit']
      }
    ]
  },
  {
    name: 'Home Cleaning',
    description: 'Deep residential cleaning, move-in/out sanitization, and upholstery care.',
    icon: 'sparkles',
    subcategories: [
      {
        name: 'Deep Home Cleaning',
        description: 'Comprehensive top-to-bottom cleaning including kitchen, bathrooms, and living spaces.',
        estimatedBasePrice: 1499,
        price: 1499,
        originalPrice: 1999,
        estimatedDuration: '180-240 mins',
        rating: 4.9,
        reviewCount: 215,
        inclusions: ['All rooms dusting', 'Deep floor scrubbing', 'Bathroom sanitization', 'Kitchen cleaning'],
        highlights: ['Eco-friendly products', 'Vetted professionals'],
        unit: 'per booking',
        requiredSkills: ['Deep Cleaning', 'Sanitization']
      },
      {
        name: 'Move-in / Move-out Cleaning',
        description: 'Thorough vacant home cleaning for landlords, tenants, and real estate turnover.',
        estimatedBasePrice: 2499,
        price: 2499,
        originalPrice: 2999,
        estimatedDuration: '240 mins',
        rating: 4.8,
        reviewCount: 132,
        inclusions: ['Appliance interior cleaning', 'Cabinet scrubbing', 'Window washing'],
        highlights: ['100% Deposit back guarantee', 'Detailed checklist'],
        unit: 'per property',
        requiredSkills: ['Move Cleaning', 'Sanitization']
      }
    ]
  },
  {
    name: 'HVAC & Climate',
    description: 'Air conditioning repair, furnace maintenance, duct cleaning, and thermostat setup.',
    icon: 'thermometer',
    subcategories: [
      {
        name: 'AC Maintenance & Inspection',
        description: 'Filter replacement, refrigerant check, coil cleaning, and cooling optimization.',
        estimatedBasePrice: 699,
        price: 699,
        originalPrice: 899,
        estimatedDuration: '60 mins',
        rating: 4.9,
        reviewCount: 156,
        inclusions: ['Filter check', 'Coil cleaning', 'Refrigerant level check'],
        highlights: ['Energy efficiency boost', 'HVAC certified'],
        unit: 'per AC unit',
        requiredSkills: ['AC Repair', 'HVAC']
      },
      {
        name: 'Heating & Furnace Repair',
        description: 'Diagnose furnace heating failures, ignitor faults, and thermostat issues.',
        estimatedBasePrice: 999,
        price: 999,
        originalPrice: 1299,
        estimatedDuration: '90 mins',
        rating: 4.8,
        reviewCount: 92,
        inclusions: ['Burner cleaning', 'Ignitor inspection', 'Thermostat calibration'],
        highlights: ['Winter emergency ready', 'Certified technicians'],
        unit: 'per system',
        requiredSkills: ['Heating Repair', 'HVAC']
      }
    ]
  },
  {
    name: 'Handyman & Carpentry',
    description: 'Furniture assembly, wall mounting, door repair, and general home repairs.',
    icon: 'hammer',
    subcategories: [
      {
        name: 'Furniture Assembly',
        description: 'Assemble flat-pack furniture, desks, bed frames, shelves, and cabinets.',
        estimatedBasePrice: 399,
        price: 399,
        originalPrice: 599,
        estimatedDuration: '60 mins',
        rating: 4.9,
        reviewCount: 178,
        inclusions: ['Unpacking', 'Structural assembly', 'Stability check'],
        highlights: ['All tools brought', 'Fast & precise'],
        unit: 'per item',
        requiredSkills: ['Furniture Assembly', 'Handyman']
      },
      {
        name: 'TV & Wall Mounting',
        description: 'Securely mount televisions, heavy mirrors, shelving units, and artwork.',
        estimatedBasePrice: 499,
        price: 499,
        originalPrice: 699,
        estimatedDuration: '45 mins',
        rating: 5.0,
        reviewCount: 204,
        inclusions: ['Stud finding', 'Bracket mounting', 'Cable management'],
        highlights: ['Concealed cables', 'Heavy duty anchors'],
        unit: 'per mount',
        requiredSkills: ['Wall Mounting', 'Handyman']
      }
    ]
  }
];

export const ensureDefaultCategories = async () => {
  await ServiceCategory.deleteMany({});
  console.log('[Category Seeder] Re-seeding default service categories with INR Indian Rupee pricing...');
  for (const catData of DEFAULT_CATEGORIES) {
    await ServiceCategory.create(catData);
    console.log(`[Category Seeder] Created category: ${catData.name}`);
  }
  console.log('[Category Seeder] Default categories seeded successfully.');
};
