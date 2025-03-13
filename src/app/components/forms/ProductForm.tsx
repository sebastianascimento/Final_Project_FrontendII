"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { productSchema } from "@/app/lib/formValidationSchemas";
import { createProduct } from "@/app/lib/actions";


type ProductInputs = z.infer<typeof productSchema>;

const ProductForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInputs>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    createProduct({ success: false, error: false }, data);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new product" : "Update product"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Product Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Description"
          name="description"
          defaultValue={data?.description}
          register={register}
          error={errors?.description}
        />
        <InputField
          label="Category"
          name="categoryName"
          defaultValue={data?.categoryName}
          register={register}
          error={errors?.categoryName}
        />
        <InputField
          label="Brand"
          name="brandName"
          defaultValue={data?.brandName}
          register={register}
          error={errors?.brandName}
        />
        <InputField
          label="Supplier"
          name="supplierName"
          defaultValue={data?.supplierName}
          register={register}
          error={errors?.supplierName}
        />
        <InputField
          label="Price"
          name="price"
          type="number"
          defaultValue={data?.price}
          register={register}
          error={errors?.price}
        />
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ProductForm;