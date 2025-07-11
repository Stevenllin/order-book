import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Loading from './Loading.vue';
import { SizeNameEnum } from '../../core/enums/system/SizeNameEnum';

describe('Loading', () => {
  it('should render loading spinner without text by default', () => {
    const wrapper = mount(Loading);
    expect(wrapper.find('.loading-spinner').exists()).toBe(true);
    expect(wrapper.find('.loading-text').exists()).toBe(false);
  });

  it('should render loading text when text prop is provided', () => {
    const text = 'Loading...';
    const wrapper = mount(Loading, {
      props: {
        text
      }
    });
    expect(wrapper.find('.loading-text').text()).toBe(text);
  });

  it('should apply correct size class based on size prop', () => {
    const wrapper = mount(Loading, {
      props: {
        size: SizeNameEnum.SMALL
      }
    });
    expect(wrapper.classes()).toContain('size-small');
  });

  it('should apply large size class when size prop is large', () => {
    const wrapper = mount(Loading, {
      props: {
        size: SizeNameEnum.LARGE
      }
    });
    expect(wrapper.classes()).toContain('size-large');
  });

  it('should use medium size by default', () => {
    const wrapper = mount(Loading);
    expect(wrapper.classes()).toContain('size-medium');
  });
});
