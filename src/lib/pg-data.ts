export const PG_ADDRESSES: Record<string, string> = {
  "Madilu Aarna": "#418, 94th Cross, near DSCE Gate 3, Kumarswamy Layout, 1st Stage, Bangalore, 560078",
  "Madilu Aishwarya": "#246, ABM South City, Beside Dayanand Sagar Medical College, Devaraggahalli, Harohhalli, Bangalore, Karnataka",
  "Madilu Ambara": "#51, 1st Cross, Next to Anjaneya Temple Kumar Swamy Layout 1st stage, Bengaluru-78",
  "Madilu Beeshma": "#1626, 50ft main road, opp to Apollo Pharmacy, Kumaraswamy Layout 1st stage, Bengaluru-78",
  "Madilu Drona": "#71, 3rd cross, GN Halli, Kumaraswamy Layout 1st stage, Bengaluru-78",
  "Madilu Eeshan": "",
  "Madilu Elite": "#1651, 1st Main Road, Kumar Swamy Layout 1st stage, Bengaluru-78",
  "Madilu Pradanya": "",
  "Madilu Rajlee": "#32/A, 2nd Cross, Near Dayananda Sagar College, Kumar Swamy Layout 1st Stage, Bengaluru-78",
  "Madilu Sai Siri": "#1570, 9th cross, Kumarswamy layout 1st stage, Bengaluru-78",
  "Madilu Siri": "#77/1, Shubhapriya Arcade, 4th cross, Kumaraswamy Layout, 1st Stage, Bengaluru-78",
};

export const PG_LIST = Object.keys(PG_ADDRESSES);

export const OWNER_LIST = [
  {
    name: "B T Rajanna",
    fatherName: "T S Thodappa",
    contact: "8095609333",
    age: "72",
  },
  {
    name: "V N Leelavathi",
    fatherName: "Neelappa",
    contact: "8105127333",
    age: "67",
  },
  {
    name: "Naveen Kumar B R",
    fatherName: "B T Rajanna",
    contact: "9980143133",
    age: "44",
  },
  {
    name: "Priyanka M",
    fatherName: "M Manjunath",
    contact: "9620530333",
    age: "31",
  },
];

export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMGMgKmlE7yHTh3hHbz3jBvQvqDJ_igNvzm_4hu_KQvQwPoMfmo-9yTmyNHjf0sFVsN4JtkzRt7r5C/pub?output=csv";

export type Student = {
  name: string;
  dob: string;
  phone: string;
  email: string;
  pg: string;
  permanentAddress: string;
  parentName: string;
  parentAddress: string;
  parentPhone: string;
  parentEmail: string;
  paymentMode: string;
  declaration: string;
  timestamp: string;
};

export type Instalment = {
  amount: number;
  dueDate: string;
};

export type AgreementData = {
  student: Student;
  ownerName: string;
  ownerContact: string;
  ownerFatherName: string;
  ownerAge: string;
  ownerAddress: string;
  residentAge: string;
  residentCollege: string;
  residentStudentId: string;
  parentFatherName: string;
  parentAge: string;
  pgName: string;
  pgAddress: string;
  roomNumber: string;
  monthlyRent: number;
  paymentMode: "Monthly" | "Instalments";
  instalments?: Instalment[];
  startDate: string;
  endDate: string;
  securityDeposit: number;
  maintenanceCharges: number;
};

export type StoredAgreement = {
  id: string;
  createdAt: string;
  data: AgreementData;
};
