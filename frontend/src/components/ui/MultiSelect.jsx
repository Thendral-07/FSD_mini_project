import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";

export function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  noneOptionValue = "None",
  noneOptionLabel = "No Restrictions (None)",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionValue) => {
    if (optionValue === noneOptionValue) {
      // If selecting "None", clear all others and set only [noneOptionValue] or []
      if (value.includes(noneOptionValue)) {
        onChange([]);
      } else {
        onChange([noneOptionValue]);
      }
      return;
    }

    // If selecting a normal option, remove "None" if present
    const cleanList = value.filter((v) => v !== noneOptionValue);
    if (cleanList.includes(optionValue)) {
      onChange(cleanList.filter((v) => v !== optionValue));
    } else {
      onChange([...cleanList, optionValue]);
    }
  };

  const handleRemove = (e, optionValue) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const isNoneSelected = value.includes(noneOptionValue) || value.length === 0;

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[46px] w-full rounded-xl border bg-background px-3 py-2 text-sm flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 ${
          isOpen ? "ring-2 ring-primary/40 border-primary shadow-sm" : "border-input hover:border-primary/50"
        }`}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1 pr-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground select-none">{placeholder}</span>
          ) : (
            value.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in-95 duration-150"
              >
                <span>{val === noneOptionValue ? noneOptionLabel : val}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, val)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 inline-flex items-center justify-center transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </div>

      {/* Smooth Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-xl p-1.5 backdrop-blur-md"
          >
            {/* "None / No Preferences" option */}
            <div
              onClick={() => handleToggle(noneOptionValue)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                value.includes(noneOptionValue)
                  ? "bg-primary/15 text-primary font-semibold"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{noneOptionLabel}</span>
              {value.includes(noneOptionValue) && <Check className="w-4 h-4 text-primary shrink-0" />}
            </div>

            <div className="my-1 border-t border-border/50" />

            {/* List of regular options */}
            {options.map((opt) => {
              const optVal = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const isSelected = value.includes(optVal);

              return (
                <div
                  key={optVal}
                  onClick={() => handleToggle(optVal)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/15 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{optLabel}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
