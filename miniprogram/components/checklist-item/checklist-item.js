Component({
  properties: {
    checked: { type: Boolean, value: false },
    label: { type: String, value: '' },
    sub: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onTap() {
      if (this.data.disabled) return;
      this.triggerEvent('toggle', { checked: !this.data.checked });
    },
  },
});
