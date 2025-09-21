export const createNameInitials = (name: string): string => {
  return name
    .split(' ')
    .map(namePart => namePart.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const processProviderData = (provider: any) => {
  if (provider.avatar_url) {
    return provider;
  }
  
  return {
    ...provider,
    nameInitials: createNameInitials(provider.name),
  };
};

export const processProvidersArray = (providers: any[]) => {
  return providers.map(processProviderData);
};
