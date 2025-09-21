export const createNameInitials = (name: string): string => {
  return name
    .split(' ')
    .map(namePart => namePart.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const processAppointmentUser = (user: any) => {
  return {
    ...user,
    avatar_url: user.avatar_url ?? createNameInitials(user.name),
  };
};

export const formatAppointmentData = (appointment: any) => {
  return {
    ...appointment,
    user: processAppointmentUser(appointment.user),
  };
};
