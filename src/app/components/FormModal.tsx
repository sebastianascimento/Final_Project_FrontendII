"use client";

import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import React, { JSX } from "react";
import {
  deleteProduct,
  deleteOrder,
  deleteCustomer,
  deleteShipping,
  deleteStock,
} from "@/app/lib/actions";

const ProductForm = dynamic(() => import("./forms/ProductForm"), {
  loading: () => <h1>Loading...</h1>,
});

const OrderForm = dynamic(() => import("./forms/OrderForm"), {
  loading: () => <h1>Loading...</h1>,
});

const CustomerForm = dynamic(() => import("./forms/ClientForm"), {
  loading: () => <h1>Loading...</h1>,
});

const StockForm = dynamic(() => import("./forms/StockForm"), {
  loading: () => <h1>Loading...</h1>,
});

const ShippingForm = dynamic(() => import("./forms/ShippingForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (props: {
    type: "create" | "update";
    data?: any;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => JSX.Element;
} = {
  product: (props) => <ProductForm {...props} />,
  order: (props) => <OrderForm {...props} />,
  customer: (props) => <CustomerForm {...props} />,
  stock: (props) => <StockForm {...props} />,
  shipping: (props) => <ShippingForm {...props} />,
};

const FormModal = ({
  table,
  type,
  data,
  id,
}: {
  table: "product" | "shipping" | "order" | "customer" | "stock" | "shipping";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
}) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    error: boolean;
    message?: string;
  } | null>(null);

  const getButtonStyle = () => {
    switch (type) {
      case "create":
        return "w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow";
      case "update":
        return "bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-sm";
      case "delete":
        return "bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-sm";
      default:
        return "bg-blue-500 text-white p-1 rounded-sm";
    }
  };

  const handleDelete = async () => {
    if (!id) {
      console.error("ID is required for deletion");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteResult(null);

      const formData = new FormData();
      formData.append("id", id.toString());

      let result;
      if (table === "order") {
        console.log(`Deleting order with ID: ${id}`);
        result = await deleteOrder({ success: false, error: false }, formData);
      } else if (table === "customer") {
        console.log(`Deleting customer with ID: ${id}`);
        result = await deleteCustomer(
          { success: false, error: false },
          formData
        );
      } else if (table === "shipping") {
        console.log(`Deleting shipping with ID: ${id}`);
        result = await deleteShipping(id);
      } else if (table === "stock") {
        console.log(`Deleting stock with ID: ${id}`);
        result = await deleteStock({ success: false, error: false }, formData);
      } else {
        console.log(`Deleting ${table} with ID: ${id}`);
        result = await deleteProduct(
          { success: false, error: false },
          formData
        );
      }

      setDeleteResult(result);

      if (result.success) {
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      setDeleteResult({ success: false, error: true });
    } finally {
      setIsDeleting(false);
    }
  };
  const renderForm = () => {
    if (type === "delete") {
      return (
        <div className="flex flex-col gap-4 p-4">
          {deleteResult?.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {table.charAt(0).toUpperCase() + table.slice(1)} deleted
              successfully!
            </div>
          )}

          {deleteResult?.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {deleteResult.message ||
                `Failed to delete ${table}. It may be referenced by other records.`}
            </div>
          )}

          {!deleteResult && (
            <>
              <h2 className="text-xl font-semibold">Confirm Deletion</h2>
              <p>
                Are you sure you want to delete this {table}? This action cannot
                be undone.
              </p>
              {table === "customer" && (
                <p className="text-sm text-orange-600 mt-2">
                  Note: Customers with associated orders cannot be deleted.
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
              disabled={isDeleting}
            >
              Cancel
            </button>
            {!deleteResult?.success && (
              <button
                type="button"
                onClick={handleDelete}
                className={`${
                  isDeleting ? "bg-gray-500" : "bg-red-500 hover:bg-red-600"
                } text-white py-2 px-4 rounded-md`}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      );
    } else {
      const FormComponent = forms[table];
      if (!FormComponent) {
        return <div>Form component not found for table: {table}</div>;
      }
      return <FormComponent type={type} data={data} setOpen={setOpen} />;
    }
  };

  const renderButtonContent = () => {
    if (type === "create") {
      return (
        <Image src="/icons/create.png" alt="Add New" width={14} height={14} />
      );
    } else if (type === "update") {
      return <Image src="/icons/edit.png" alt="Edit" width={14} height={14} />;
    } else {
      return (
        <Image src="/icons/delete.png" alt="Delete" width={14} height={14} />
      );
    }
  };

  return (
    <>
      <button
        className={getButtonStyle()}
        onClick={() => setOpen(true)}
        aria-label={
          type === "create" ? "Create" : type === "update" ? "Update" : "Delete"
        }
      >
        {renderButtonContent()}
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {type === "create"
                  ? `Add New ${table}`
                  : type === "update"
                  ? `Update ${table}`
                  : `Delete ${table}`}
              </h2>
              <button
                className="hover:bg-gray-100 rounded-full p-1"
                onClick={() => setOpen(false)}
                disabled={isDeleting}
              >
                <Image
                  src="/icons/close.png"
                  alt="Close"
                  width={14}
                  height={14}
                />
              </button>
            </div>
            <div className="p-4">{renderForm()}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
