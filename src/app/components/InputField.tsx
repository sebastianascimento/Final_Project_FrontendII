import React from 'react';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface InputFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  defaultValue?: any;
  register: UseFormRegister<T>;
  error?: any;
}

const InputField = <T extends FieldValues>({
  label,
  name,
  type = "text",
  defaultValue,
  register,
  error,
}: InputFieldProps<T>) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        {...register(name, { valueAsNumber: type === "number" })}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
      />
      {error && (
        <span className="text-red-500 text-xs">{error.message}</span>
      )}
    </div>
  );
};

export default InputField;