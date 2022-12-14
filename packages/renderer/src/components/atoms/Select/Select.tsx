/* eslint-disable @typescript-eslint/ban-ts-comment */
import clsx from 'clsx';
import {useMemo} from 'react';
import ReactSelectCmp from 'react-select';
import ReactSelectAsyncCmp from 'react-select/async';
import ReactSelectAsyncCreatableCmp from 'react-select/async-creatable';
import ReactSelectCreatableCmp from 'react-select/creatable';

import type {InputSize} from '../Input';
import {SelectClearIndicator} from './SelectClearIndicator';
import {SelectControl} from './SelectControl';
import {SelectDefaultOptionComponent} from './SelectDefaultOptionComponent';
import {SelectDropdownIndicator} from './SelectDropdownIndicator';
import {SelectIndicatorSeparator} from './SelectIndicatorSeperator';
import {SelectInput} from './SelectInput';
import {SelectMenu} from './SelectMenu';
import {SelectPlaceholder} from './SelectPlaceholder';
import {SelectSingleValue} from './SelectSingleValue';
import {SelectValueContainer} from './SelectValueContainer';

export interface SelectOption {
  label: string;
  value: string;
}

type SelectProps = {
  className?: string;
  async?: boolean;
  creatable?: boolean;
  size?: InputSize;
  disabled?: boolean;
  options?: SelectOption[];
  label?: string;
  error?;
  helperText?: string;
  value?: any;
  required?: boolean;
  inputProps?: Record<string, any>;
  hideIndicator?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  onChange;
  SingleValueComponent?;
  OptionComponent?;
  instanceId?;
  id?;
  selectRef?;
  hideMenuIfNoOptions?: boolean;
};

export const SelectComponent: React.FC<SelectProps> = ({
  async = false,
  creatable = false,
  className = '',
  placeholder = '',
  options = [],
  label,
  size = 'medium',
  error,
  helperText,
  value,
  disabled = false,
  selectRef,
  OptionComponent = SelectDefaultOptionComponent,
  SingleValueComponent = SelectSingleValue,
  required,
  inputProps,
  ...props
}) => {
  const SelectCmp = useMemo(
    () =>
      async
        ? creatable
          ? ReactSelectAsyncCreatableCmp
          : ReactSelectAsyncCmp
        : creatable
        ? ReactSelectCreatableCmp
        : ReactSelectCmp,
    [async, creatable],
  );

  return (
    <div className={clsx(className, 'max-w-xl')}>
      {label && (
        <p className={clsx('block pb-2', error ? '!text-error' : 'text-white')}>
          {required ? `${label} *` : label}
        </p>
      )}
      {/* @ts-ignore */}
      <div className={clsx(disabled ? '!cursor-not-allowed opacity-50' : '')}>
        <SelectCmp
          styles={{menuPortal: base => ({...base, zIndex: 9999})}}
          menuPortalTarget={typeof document !== 'undefined' ? document?.body : undefined}
          value={options.find(c => c.value === value)}
          options={options}
          placeholder={placeholder}
          components={{
            Option: OptionComponent,
            Input: SelectInput,
            Placeholder: SelectPlaceholder,
            IndicatorSeparator: SelectIndicatorSeparator,
            DropdownIndicator: SelectDropdownIndicator,
            Control: SelectControl,
            Menu: SelectMenu,
            SingleValue: SingleValueComponent,
            ValueContainer: SelectValueContainer,
            ClearIndicator: SelectClearIndicator,
          }}
          //@ts-ignore
          inputProps={{
            autoComplete: 'off',
            ...inputProps,
          }}
          noOptionsMessage={() => <span className="text-sm text-dark-40">Not found</span>}
          loadingMessage={() => <span className="text-sm text-dark-40">loading...</span>}
          size={size}
          error={error}
          helperText={helperText}
          isDisabled={disabled}
          menuPlacement="top"
          ref={selectRef}
          {...props}
        />
      </div>
      {(!!error || helperText) && (
        <p className={clsx('mt-1 text-sm', error ? '!border-error !text-error' : 'text-dark-60')}>
          {helperText}
        </p>
      )}
    </div>
  );
};
