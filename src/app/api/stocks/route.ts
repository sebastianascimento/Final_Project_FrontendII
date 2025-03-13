import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const stocks = await prisma.stock.findMany({
      include: {
        product: {
          select: {
            name: true,
            price: true
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { productId: 'asc' },
        { id: 'asc' }
      ]
    });
    
    return NextResponse.json(stocks, { status: 200 });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}