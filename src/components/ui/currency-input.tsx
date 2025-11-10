import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string) => void;
  allowNegative?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, allowNegative = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");

    // Formata o valor para exibição (1234.56 -> 1.234,56)
    const formatCurrency = (val: string | number): string => {
      if (!val && val !== 0) return "";
      
      const numStr = String(val).replace(/[^\d.-]/g, "");
      if (!numStr || numStr === "-") return numStr;
      
      const isNegative = numStr.startsWith("-");
      const absoluteValue = numStr.replace("-", "");
      
      const [integerPart, decimalPart] = absoluteValue.split(".");
      
      // Formata a parte inteira com separador de milhares
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      
      // Limita casas decimais a 2
      const limitedDecimal = decimalPart ? decimalPart.slice(0, 2) : "";
      
      let result = formattedInteger;
      if (limitedDecimal) {
        result += "," + limitedDecimal;
      } else if (absoluteValue.includes(".")) {
        result += ",";
      }
      
      return isNegative && allowNegative ? "-" + result : result;
    };

    // Converte valor formatado para número (1.234,56 -> 1234.56)
    const unformatCurrency = (formattedVal: string): string => {
      if (!formattedVal) return "";
      
      const isNegative = formattedVal.startsWith("-");
      const cleaned = formattedVal.replace(/[^\d,]/g, "").replace(",", ".");
      
      return isNegative && allowNegative ? "-" + cleaned : cleaned;
    };

    // Atualiza displayValue quando value externo muda
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permite apenas números, ponto, vírgula e opcionalmente menos
      const regex = allowNegative ? /^-?[\d.,]*$/ : /^[\d.,]*$/;
      if (!regex.test(inputValue)) return;
      
      // Remove formatação anterior e aplica nova
      const unformatted = unformatCurrency(inputValue);
      const formatted = formatCurrency(unformatted);
      
      setDisplayValue(formatted);
      
      // Envia o valor não formatado para o onChange
      if (onChange) {
        onChange(unformatted);
      }
    };

    return (
      <Input
        type="text"
        inputMode="decimal"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
