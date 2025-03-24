export default function Loading() {
    return (
      <div className="h-screen flex">
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-white">
          {/* Sidebar skeleton */}
          <div className="animate-pulse h-6 w-24 bg-gray-200 mb-8 rounded"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] p-4">
          {/* Navbar skeleton */}
          <div className="animate-pulse h-12 bg-gray-200 rounded mb-4"></div>
          
          {/* Content skeleton */}
          <div className="bg-white p-4 rounded-md m-4 mt-0">
            <div className="flex justify-between mb-6">
              <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>
              <div className="animate-pulse h-10 w-48 bg-gray-200 rounded"></div>
            </div>
            
            {/* Table skeleton */}
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-2"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
              ))}
            </div>
            
            {/* Pagination skeleton */}
            <div className="animate-pulse mt-4 flex justify-end">
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }