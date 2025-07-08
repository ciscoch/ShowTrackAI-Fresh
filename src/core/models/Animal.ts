export interface Animal {
  id: string;
  name: string;
  tagNumber: string;
  penNumber: string;
  species: 'Cattle' | 'Goat' | 'Pig' | 'Sheep';
  breed: string;
  breeder: string;
  birthDate?: Date;
  pickupDate?: Date;
  projectType: 'Market' | 'Breeding' | 'Show' | 'Dairy';
  acquisitionCost: number;
  weight?: number;
  healthStatus: 'Healthy' | 'Sick' | 'Injured' | 'Under Treatment';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  owner_id?: string; // For backend compatibility - links animal to authenticated user
}

export interface CreateAnimalRequest extends Omit<Animal, 'id' | 'createdAt' | 'updatedAt' | 'healthStatus'> {}

export const SPECIES_OPTIONS = ['Cattle', 'Goat', 'Pig', 'Sheep'] as const;

export const BREED_OPTIONS = {
  Cattle: [
    'Angus',
    'Hereford',
    'Charolais',
    'Simmental',
    'Maine-Anjou',
    'Shorthorn',
    'Limousin',
    'Chianina',
    'Brahman',
    'Santa Gertrudis',
    'Red Angus',
    'Gelbvieh',
    'Crossbred',
    'Other'
  ],
  Goat: [
    'Boer',
    'Spanish',
    'Nubian',
    'Alpine',
    'LaMancha',
    'Saanen',
    'Toggenburg',
    'Nigerian Dwarf',
    'Crossbred',
    'Other'
  ],
  Pig: [
    'Yorkshire',
    'Hampshire',
    'Duroc',
    'Berkshire',
    'Spotted',
    'Chester White',
    'Poland China',
    'Landrace',
    'Crossbred',
    'Other'
  ],
  Sheep: [
    'Suffolk',
    'Hampshire',
    'Dorset',
    'Southdown',
    'Shropshire',
    'Oxford',
    'Columbia',
    'Rambouillet',
    'Corriedale',
    'Crossbred',
    'Other'
  ]
};

export const PROJECT_TYPES = ['Market', 'Breeding', 'Show', 'Dairy'] as const;