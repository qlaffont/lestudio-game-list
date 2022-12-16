import {components} from 'react-select';

export const SelectMenu = props => {
  if (props.selectProps.inputValue.length === 0 && props.selectProps.hideMenuIfNoOptions)
    return null;

  return (
    <>
      <components.Menu {...props} />
    </>
  );
};
