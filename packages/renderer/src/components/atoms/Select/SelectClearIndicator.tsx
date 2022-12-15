import {components} from 'react-select';

export const SelectClearIndicator = props => (
  <components.ClearIndicator {...props}>
    {!props?.selectProps?.isClearable ? (
      <div className="hidden"></div>
    ) : (
      <i className="icon icon-close block h-4 w-4 cursor-pointer bg-white"></i>
    )}
  </components.ClearIndicator>
);
