import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderForm from '../components/forms/OrderForm';

// Set the exact date and username you provided
const TEST_DATE = '2025-03-26 21:05:37';
const TEST_USERNAME = 'sebastianascimento';

// Mock the actions module - adjust the names based on your actual implementation
jest.mock('../lib/actions', () => ({
  createOrder: jest.fn(() => Promise.resolve({ success: true })),
  updateOrder: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { 
        name: TEST_USERNAME,
        email: 'test@example.com',
        companyId: '123',
      }
    },
    status: 'authenticated'
  }))
}));

// Create a simple mock response
const createMockResponse = (data: any): Response => {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.reject(new Error('Not implemented')),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this; }
  } as Response;
};

// Simplified fetch mock that always returns success
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve(createMockResponse([{ id: 1, name: 'Test Item' }]))
) as jest.MockedFunction<typeof fetch>;

// Suppress console errors for act warnings
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('OrderForm', () => {
  const mockSetOpen = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Most basic test - just check it renders without crashing
  it('renders without crashing', () => {
    render(<OrderForm type="create" setOpen={mockSetOpen} />);
    // No assertions needed - test will fail if render throws an error
  });
  
  // Test create mode
  it('renders in create mode', () => {
    const { container } = render(<OrderForm type="create" setOpen={mockSetOpen} />);
    expect(container.firstChild).toBeInTheDocument();
  });
  
  // Test update mode with timestamp
  it('renders in update mode', () => {
    // Create mock data for an order
    const mockData = {
      id: 1,
      customerId: 101,
      status: 'PENDING',
      items: [{ productId: 1, quantity: 2, price: 19.99 }],
      totalAmount: 39.98,
      // Use the exact timestamp you specified
      updatedAt: '2025-03-26T21:05:37Z',
      updatedBy: TEST_USERNAME
    };
    
    const { container } = render(
      <OrderForm type="update" data={mockData} setOpen={mockSetOpen} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});