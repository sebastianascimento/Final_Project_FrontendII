"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Truck,
  AlertCircle,
  RefreshCcw,
  Building,
  Package,
  Clock,
  FileText,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";

const localizer = momentLocalizer(moment);

const allViews = [Views.MONTH, Views.WEEK];

interface DeliveryEvent {
  id: number;
  productName: string;
  customerName: string;
  estimatedDelivery: Date;
  shippingStatus: string;
  address: string;
  orderNumber: string;
  carrier?: string;
  companyId?: string;
}

interface CalendarDeliveryEvent extends DeliveryEvent {
  title: string;
  start: Date;
  end: Date;
}

interface ToolbarProps {
  date: Date;
  view: View;
  views: View[];
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  localizer: { messages: any };
  label: string;
  companyName?: string;
}

// Delivery Details Modal Component
interface DeliveryModalProps {
  event: CalendarDeliveryEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const DeliveryDetailsModal = ({ event, isOpen, onClose }: DeliveryModalProps) => {
  if (!isOpen || !event) return null;
  
  const statusColors: { [key: string]: string } = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    shipped: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    delayed: "bg-red-100 text-red-800 border-red-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200"
  };

  const defaultStatusClass = "bg-gray-100 text-gray-800 border-gray-200";
  const statusClass = event.shippingStatus && statusColors[event.shippingStatus.toLowerCase()] 
    ? statusColors[event.shippingStatus.toLowerCase()]
    : defaultStatusClass;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">Detalhes da Entrega</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Package size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Produto</p>
              <p className="font-medium">{event.productName}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entrega Estimada</p>
              <p className="font-medium">
                {new Date(event.estimatedDelivery).toLocaleDateString()} às {' '}
                {new Date(event.estimatedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          {event.carrier && (
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Truck size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transportadora</p>
                <p className="font-medium">{event.carrier}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Número do Pedido</p>
              <p className="font-medium">{event.orderNumber}</p>
            </div>
          </div>

          <div className="mt-2">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}>
              {event.shippingStatus}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const goToCurrent = () => {
    toolbar.onNavigate("TODAY");
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-sm md:text-lg font-medium text-gray-800">
        {date.format("MMMM")}{" "}
        <span className="font-bold">{date.format("YYYY")}</span>
        {toolbar.companyName && (
          <span className="text-xs md:text-sm font-normal text-gray-500 ml-2">
            ({toolbar.companyName})
          </span>
        )}
      </span>
    );
  };

  const viewNames: { [key: string]: string } = useMemo(() => {
    return {
      month: "Month",
      week: "Week",
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:justify-between items-center p-2 md:p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 mb-2 md:mb-0">
        <button
          type="button"
          onClick={goToBack}
          className="p-1 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <button
          type="button"
          onClick={goToCurrent}
          className="flex items-center px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <CalendarIcon size={14} className="mr-1 text-blue-500" />
          <span>Today</span>
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="p-1 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
      <div className="mb-2 md:mb-0">{label()}</div>
      <div className="flex gap-1 md:gap-2">
        {toolbar.views.map((view: View) => (
          <button
            key={view}
            type="button"
            onClick={() => toolbar.onView(view)}
            className={`px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
              view === toolbar.view
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {viewNames[view] || view}
          </button>
        ))}
      </div>
    </div>
  );
};

interface EventComponentProps {
  event: CalendarDeliveryEvent;
  title?: React.ReactNode;
}

const DeliveryEventComponent = ({ event }: EventComponentProps) => {
  const statusColors: { [key: string]: string } = {
    pending: "bg-amber-500 border-l-4 border-amber-600",
    shipped: "bg-blue-500 border-l-4 border-blue-600",
    delivered: "bg-green-500 border-l-4 border-green-600",
    delayed: "bg-red-500 border-l-4 border-red-600",
    processing: "bg-purple-500 border-l-4 border-purple-600",
  };

  const defaultColor = "bg-gray-500 border-l-4 border-gray-600";
  const colorClass =
    event.shippingStatus && statusColors[event.shippingStatus.toLowerCase()]
      ? statusColors[event.shippingStatus.toLowerCase()]
      : defaultColor;

  const carrierInfo = event.carrier ? `Via: ${event.carrier}` : "";

  return (
    <div
      className={`h-full p-1.5 rounded text-white ${colorClass} hover:brightness-110 transition-all`}
    >
      <div className="flex items-center gap-1">
        <Truck size={14} className="flex-shrink-0" />
        <div className="font-medium text-xs md:text-sm break-words">
          {event.productName}
        </div>
      </div>
      {event.customerName !== "Cliente" && (
        <div className="text-xs opacity-90 break-words">
          Cliente: {event.customerName}
        </div>
      )}
      {carrierInfo && (
        <div className="text-xs opacity-90 break-words">{carrierInfo}</div>
      )}
    </div>
  );
};

const MonthDeliveryEventWrapper = ({ event }: EventComponentProps) => {
  const statusColors: { [key: string]: string } = {
    pending: "bg-amber-500",
    shipped: "bg-blue-500",
    delivered: "bg-green-500",
    delayed: "bg-red-500",
    processing: "bg-purple-500",
  };

  const defaultColor = "bg-gray-500";
  const colorClass =
    event.shippingStatus && statusColors[event.shippingStatus.toLowerCase()]
      ? statusColors[event.shippingStatus.toLowerCase()]
      : defaultColor;

  return (
    <div 
      className={`p-1 rounded text-white ${colorClass} hover:bg-opacity-90`}
      title={event.productName} // Add tooltip to show full name on hover
    >
      <span className="text-xs flex items-center gap-0.5 min-w-0">
        <Truck size={10} className="flex-shrink-0" />
        <span className="whitespace-normal break-words">{event.productName}</span>
      </span>
    </div>
  );
};

const calendarGlobalStyles = `
  .rbc-calendar {
    @apply h-full flex flex-col;
  }
  .rbc-header {
    @apply py-3 font-semibold text-sm bg-gray-50 border-b border-gray-200;
  }
  .rbc-today {
    @apply bg-blue-50;
  }
  .rbc-time-view {
    @apply border border-gray-200 rounded-b-lg;
  }
  .rbc-time-header {
    @apply border-b border-gray-200;
  }
  .rbc-timeslot-group {
    @apply border-b border-gray-100;
  }
  .rbc-time-slot {
    @apply text-xs text-gray-500;
  }
  .rbc-time-content {
    @apply border-t border-gray-200;
  }
  .rbc-time-view-resources .rbc-time-gutter,
  .rbc-time-view-resources .rbc-time-header-gutter {
    @apply bg-gray-50;
  }
  .rbc-month-view {
    @apply border border-gray-200 rounded-lg flex-1 min-h-[500px];
  }
  .rbc-month-row {
    @apply border-b border-gray-200 flex-1;
  }
  .rbc-date-cell {
    @apply text-right p-1;
  }
  .rbc-date-cell > a {
    @apply text-sm font-medium text-gray-700 px-1;
  }
  .rbc-day-bg + .rbc-day-bg {
    @apply border-l border-gray-200;
  }
  .rbc-off-range-bg {
    @apply bg-gray-50;
  }
  .rbc-off-range {
    @apply text-gray-400;
  }
  .rbc-event {
    @apply rounded-md border-none;
  }
  .rbc-show-more {
    @apply text-xs text-blue-500 font-semibold;
  }
  .rbc-row-segment {
    @apply px-1;
  }
  .rbc-row-content {
    @apply z-0;
  }
  
  /* Mobile Responsive Fixes */
  @media (max-width: 640px) {
    .rbc-btn-group {
      margin: 2px;
    }
    .rbc-toolbar-label {
      padding: 0;
      margin: 4px 0;
    }
    .rbc-toolbar button {
      padding: 4px 6px;
      font-size: 0.8rem;
    }
    .rbc-header {
      padding: 8px 2px;
      font-size: 0.75rem;
    }
    .rbc-date-cell > a {
      font-size: 0.75rem;
    }
    .rbc-event {
      min-height: 26px;
      word-break: break-word;
    }
    .rbc-event-content {
      height: auto !important;
      white-space: normal !important;
    }
    .rbc-events-container {
      margin-right: 0 !important;
    }
  }
`;

interface ApiDeliveryData {
  id: number;
  productName: string;
  customerName: string;
  estimatedDelivery: string;
  shippingStatus: string;
  address: string;
  orderNumber: string;
  carrier?: string;
  companyId?: string;
}

const BigCalendar = () => {
  const { data: session, status } = useSession();
  const companyId = session?.user?.companyId;
  const companyName = session?.user?.companyName;

  const [view, setView] = useState<View>(Views.MONTH);
  const [calendarHeight, setCalendarHeight] = useState<string>("700px");
  const [deliveryData, setDeliveryData] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [noCompanyConfigured, setNoCompanyConfigured] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarDeliveryEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY" | Date) => {
    if (action === "PREV") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else if (action === "NEXT") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else if (action === "TODAY") {
      setCurrentDate(new Date());
    } else if (action instanceof Date) {
      setCurrentDate(action);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (status !== "loading" && !companyId) {
        setNoCompanyConfigured(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/logistics/deliveries?companyId=${companyId}`
      );

      if (!response.ok) {
        const errorStatus = response.status;
        const errorText = await response
          .text()
          .catch(() => "Erro desconhecido");

        throw new Error(`API error (HTTP ${errorStatus}): ${errorText}`);
      }

      const data = await response.json();

      const filteredData = data
        ? data.filter(
            (item: ApiDeliveryData) =>
              !item.companyId || item.companyId === companyId
          )
        : [];

      const formattedData: DeliveryEvent[] = filteredData.map(
        (item: ApiDeliveryData) => ({
          id: item.id,
          productName: item.productName || `Produto #${item.id}`,
          customerName: item.customerName || "Cliente",
          estimatedDelivery: new Date(item.estimatedDelivery),
          shippingStatus: item.shippingStatus || "PENDING",
          address: item.address || "Endereço de entrega",
          orderNumber: item.orderNumber || `Entrega #${item.id}`,
          carrier: item.carrier,
          companyId: item.companyId,
        })
      );

      setDeliveryData(formattedData);
    } catch (err) {
      console.error(`[2025-03-24 21:33:41] @sebastianascimento - Error fetching delivery data:`, err);
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      setDeliveryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchData();

      const intervalId = setInterval(fetchData, 5 * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [status, companyId]);

  useEffect(() => {
    if (view === Views.MONTH) {
      setCalendarHeight("700px");
    } else {
      setCalendarHeight("600px");
    }
  }, [view]);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const deliveryEvents: CalendarDeliveryEvent[] = useMemo(() => {
    return deliveryData.map((delivery: DeliveryEvent) => ({
      ...delivery,
      title: delivery.productName,
      start: delivery.estimatedDelivery,
      end: new Date(delivery.estimatedDelivery.getTime() + 60 * 60 * 1000),
    }));
  }, [deliveryData]);

  // New event selection handler to open modal instead of alert
  const handleSelectEvent = (event: CalendarDeliveryEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Modal close handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">
          Carregando informações do usuário...
        </p>
      </div>
    );
  }

  if (noCompanyConfigured || (!isLoading && !companyId)) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Building size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Configuração de Empresa Necessária
          </h3>
          <p className="text-gray-600 mb-6">
            Para visualizar o calendário de entregas, você precisa configurar
            sua empresa primeiro. Isso permite que o sistema mostre apenas as
            entregas relacionadas ao seu negócio.
          </p>
          <a
            href="/setup-company"
            className="px-4 py-2 bg-blue-500 text-white rounded-md inline-flex items-center hover:bg-blue-600 transition-colors"
          >
            <Building size={16} className="mr-2" />
            Configurar Empresa
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">Carregando dados de entrega...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden items-center justify-center">
        <div className="text-center p-5">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-gray-800">
            Erro ao carregar os dados
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Não foi possível carregar as entregas agendadas.
            <br />
            <span className="text-red-600 font-medium">{error.message}</span>
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md flex items-center mx-auto hover:bg-blue-600 transition-colors"
          >
            <RefreshCcw size={16} className="mr-2" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (deliveryEvents.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden items-center justify-center">
        <div className="text-center p-5">
          <Truck size={48} className="mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-800">
            Nenhuma entrega agendada
            {companyName && (
              <span className="text-sm font-normal ml-1">
                para {companyName}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Não há entregas com data estimativa no sistema para sua empresa.
            <br />
            <span className="text-blue-600 font-medium">
              Crie um shipping com data estimada para visualizar no calendário.
            </span>
          </p>
        </div>
      </div>
    );
  }

  const calendarComponents: any = {
    toolbar: (props: any) => (
      <CustomToolbar {...props} companyName={companyName} />
    ),
    event: DeliveryEventComponent,
    month: {
      event: MonthDeliveryEventWrapper,
    },
  };

  return (
    <>
      <div
        className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden"
        style={{ height: calendarHeight }}
      >
        <style jsx global>
          {calendarGlobalStyles}
        </style>

        <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center">
            <Truck size={18} className="text-blue-500 mr-2" />
            <h2 className="text-xs sm:text-sm font-medium text-blue-800">
              Calendário de Entregas
            </h2>
          </div>
          <div className="text-xs text-blue-600">
            {deliveryEvents.length} entregas agendadas
          </div>
        </div>

        <Calendar
          localizer={localizer}
          events={deliveryEvents}
          startAccessor="start"
          endAccessor="end"
          views={allViews}
          view={view}
          date={currentDate}
          onNavigate={handleNavigate}
          className="flex-1"
          onView={handleOnChangeView}
          components={calendarComponents}
          formats={{
            timeGutterFormat: (date: Date) => moment(date).format("h:mm A"),
            dayFormat: (date: Date) => moment(date).format("ddd DD"),
            monthHeaderFormat: (date: Date) => moment(date).format("MMMM YYYY"),
          }}
          popup={true}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal 
        event={selectedEvent} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
};

export default BigCalendar;