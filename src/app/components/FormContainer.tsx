import { prisma } from "../lib/prisma";
import FormModal from "./FormModal";

// Define tables accepted by FormContainer
export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "product"
    | "order"
    | "customer"
    | "stock"
    | "shipping";

  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

// Define tables accepted by FormModal
type FormModalTable = "order" | "product" | "customer" | "stock" | "shipping";

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  // Check if the table is valid for FormModal
  const isValidFormModalTable = ["order", "product", "customer", "stock", "shipping"].includes(table);

  if (!isValidFormModalTable) {
    console.warn(`Table "${table}" is not supported by FormModal component`);
    return (
      <div className="text-red-500">
        Form not available for table type: {table}
      </div>
    );
  }

  return (
    <div className="">
      <FormModal
        table={table as FormModalTable}
        type={type}
        data={data}
        id={id}
      />
    </div>
  );
};

export default FormContainer;