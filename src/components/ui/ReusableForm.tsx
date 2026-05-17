import { useForm } from "react-hook-form";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type FieldType = "text" | "textarea" | "number" | "email" | "select" | "date";

interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface ReusableFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  defaultValues?: Record<string, any>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReusableForm({
  fields,
  onSubmit,
  defaultValues = {},
  submitLabel = "Submit",
  cancelLabel,
  onCancel,
  isLoading = false,
}: ReusableFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });

  const renderField = (field: FormField) => {
    const error = errors[field.name]?.message as string;

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...register(field.name)}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
            disabled={isLoading || isSubmitting}
          />
        );

      case "select":
        return (
          <Select
            value={watch(field.name)}
            onValueChange={(value) => setValue(field.name, value)}
            disabled={isLoading || isSubmitting}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue
                placeholder={field.placeholder || `Select ${field.label}`}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            {...register(field.name, { valueAsNumber: true })}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
            disabled={isLoading || isSubmitting}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            {...register(field.name)}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
            disabled={isLoading || isSubmitting}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            {...register(field.name)}
            className={error ? "border-red-500" : ""}
            disabled={isLoading || isSubmitting}
          />
        );

      default:
        return (
          <Input
            {...register(field.name)}
            type={field.type === "text" ? "text" : undefined}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
            disabled={isLoading || isSubmitting}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <p className="text-sm text-red-500">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        {cancelLabel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isLoading || isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
