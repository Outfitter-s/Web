import ToasterComponent from './Toaster.svelte';
import Toast from './Toast.svelte';

const Toaster = ToasterComponent as typeof ToasterComponent & { Toast: typeof Toast };
Toaster.Toast = Toast;

export default Toaster;
