import { IState, State, Country } from "country-state-city";

import React, { useCallback, useState, forwardRef, useEffect, useMemo } from "react";

// shadcn
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// utils
import { cn } from "@/lib/utils";

// assets
import { ChevronDown, CheckIcon } from "lucide-react";

interface StateDropdownProps {
  // options?: Country[];
  country?: string;
  onChange?: (state: IState) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

const StateDropdownComponent = (
  { onChange, defaultValue, disabled = false, placeholder = "Select a State", country, ...props }: StateDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) => {
  const [open, setOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<IState | undefined>(undefined);

  const triggerClasses = cn(
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
  );

  const options = useMemo(() => {
    const selectedCountry = Country.getAllCountries().find((c) => c.isoCode === country || c.name === country);
    return State.getStatesOfCountry(selectedCountry?.isoCode);
  }, [country]);

  useEffect(() => {
    if (defaultValue) {
      const initialState = options.find((state) => state.name === defaultValue);
      if (initialState) {
        setSelectedState(initialState);
      } else {
        // Reset selected country if defaultValue is not found
        setSelectedState(undefined);
      }
    } else {
      // Reset selected country if defaultValue is undefined or null
      setSelectedState(undefined);
    }
  }, [defaultValue, options]);

  const handleSelect = useCallback(
    (state: IState) => {
      setSelectedState(state);
      onChange?.(state);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={ref} className={triggerClasses} disabled={disabled} {...props}>
        {selectedState ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedState.name}</span>
          </div>
        ) : (
          <span>{placeholder || setSelectedState.name}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent collisionPadding={10} side="bottom" className="min-w-[--radix-popper-anchor-width] p-0">
        <Command className="w-full max-h-[200px] sm:max-h-[270px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Search states..." />
            </div>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((x) => x.name)
                .map((option, key: number) => (
                  <CommandItem className="flex items-center w-full gap-2" key={key} onSelect={() => handleSelect(option)}>
                    <div className="flex flex-grow w-0 space-x-2 overflow-hidden">
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{option.name}</span>
                    </div>
                    <CheckIcon className={cn("ml-auto h-4 w-4 shrink-0", option.name === selectedState?.name ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

StateDropdownComponent.displayName = "StateDropdownComponent";

export const StateDropdown = forwardRef(StateDropdownComponent);
