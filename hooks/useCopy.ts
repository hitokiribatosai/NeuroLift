import { useLanguage } from '../contexts/LanguageContext';
import { InterfaceCopyKey, translateInterface } from '../utils/interfaceCopy';

export function useCopy() {
  const { language } = useLanguage();
  return (key: InterfaceCopyKey, ...values: (string | number)[]) => translateInterface(language, key, ...values);
}
