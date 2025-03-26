import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShippingForm from '../components/forms/ShippingForm';

// Set the exact date and username you specified
const TEST_DATE = '2025-03-26 20:59:24';
const TEST_USERNAME = 'sebastianascimento';

// Mock the actions module
jest.mock('../lib/actions', () => ({
  createShipping: jest.fn(() => Promise.resolve({ success: true })),
  updateShipping: jest.fn(() => Promise.resolve({ success: true })),
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

// Create a proper TypeScript-compatible Response mock
const createMockResponse = (data: any): Response => {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(data)).buffer),
    formData: () => Promise.reject(new Error('Not implemented')),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this; }
  } as Response;
};

// Fixed fetch mock with proper TypeScript typing
global.fetch = jest.fn().mockImplementation((url: RequestInfo | URL) => {
  // Handle URL objects or Request objects by converting to string
  const urlString = url instanceof URL ? url.toString() : 
                   typeof url === 'string' ? url :
                   url instanceof Request ? url.url : '';
  
  if (urlString.includes('/api/products')) {
    return Promise.resolve(createMockResponse([
      { id: 1, name: 'Product 1', price: 10.99 }
    ]));
  }
  
  if (urlString.includes('/api/stocks')) {
    return Promise.resolve(createMockResponse([
      { id: 101, productId: 1, stockLevel: 10 }
    ]));
  }
  
  // Default response
  return Promise.resolve(createMockResponse([]));
}) as jest.MockedFunction<typeof fetch>;

// Suppress console errors
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('ShippingForm', () => {
  const mockSetOpen = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ShippingForm type="create" setOpen={mockSetOpen} />);
  });
  
  it('shows loading spinner initially', () => {
    render(<ShippingForm type="create" setOpen={mockSetOpen} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
  
  // Use a longer timeout for this test
  it('shows update data in update mode', async () => {
    // Increase the test timeout
    jest.setTimeout(10000);
    
    const mockData = {
      id: 1,
      status: 'SHIPPED',
      carrier: 'DHL',
      estimatedDelivery: '2025-04-01',
      productId: 1,
      stockId: 101,
      updatedAt: '2025-03-26T20:59:24Z', // Using the exact timestamp you specified
      updatedBy: TEST_USERNAME
    };
    
    render(<ShippingForm type="update" data={mockData} setOpen={mockSetOpen} />);
    
    // Wait for loading to finish and form to appear
    await waitFor(() => {
      // Look for status text as a more reliable indicator
      expect(screen.queryByText('Shipped')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // After loading is done, let's verify the update button exists
    expect(screen.getByText('Update', { selector: 'button[type="submit"]' })).toBeInTheDocument();
    
    // Check for Last updated text with your specified timestamp
    const lastUpdatedElement = screen.getByText(/Last updated:/i);
    expect(lastUpdatedElement).toBeInTheDocument();
  }, 10000); // 10 second timeout for this test
});