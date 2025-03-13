"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createSubject } from "@/app/lib/actions";
import { useSession } from "next-auth/react";

const subjectSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required!" }),
});

type SubjectSchema = z.infer<typeof subjectSchema>;

const SubjectForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const { data: session } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
  });

  const onSubmit = handleSubmit(async (formData) => {
    const result = await createSubject(formData);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update the subject"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Subject Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default SubjectForm;
