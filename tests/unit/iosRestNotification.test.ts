import { beforeEach, expect, test, vi } from 'vitest';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createIOSRestScheduler, IOS_REST_ID } from '../../utils/iosRestNotification';
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {
  checkPermissions: vi.fn(), schedule: vi.fn(), cancel: vi.fn(),
  getDeliveredNotifications: vi.fn(), removeDeliveredNotifications: vi.fn(),
} }));
const notice = { title: 'Press', body: 'Chest · Set 2 of 3', readyTitle: 'Rest finished', restTitle: 'Rest', restEnd: 20000 };
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(10000);
  vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' });
  vi.mocked(LocalNotifications.getDeliveredNotifications).mockResolvedValue({ notifications: [] });
});
test('schedules absolute deadline, deduplicates and extends using same ID', async () => {
  const sync = createIOSRestScheduler();
  await sync(notice); await sync(notice);
  expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
  expect(LocalNotifications.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({ id: IOS_REST_ID, schedule: { at: new Date(20000) }, silent: true, sound: 'default' })] });
  await sync({ ...notice, restEnd: 30000 });
  expect(LocalNotifications.schedule).toHaveBeenCalledTimes(2);
});
test('skip cancels future rest; finish removes only our delivered alert', async () => {
  const sync = createIOSRestScheduler();
  await sync(notice); await sync({ ...notice, restEnd: 0 });
  expect(LocalNotifications.cancel).toHaveBeenCalledWith({ notifications: [{ id: IOS_REST_ID }] });
  vi.mocked(LocalNotifications.getDeliveredNotifications).mockResolvedValue({ notifications: [{ id: IOS_REST_ID, title: 'Rest', body: 'Ready' }, { id: 99, title: 'Other', body: 'Other' }] });
  await sync(null);
  expect(LocalNotifications.removeDeliveredNotifications).toHaveBeenCalledWith({ notifications: [{ id: IOS_REST_ID, title: 'Rest', body: 'Ready' }] });
});
test('JS expiry does not cancel the scheduled OS alert', async () => {
  const sync = createIOSRestScheduler();
  await sync(notice);
  vi.spyOn(Date, 'now').mockReturnValue(20001);
  await sync({ ...notice, restEnd: 0 });
  expect(LocalNotifications.cancel).not.toHaveBeenCalled();
});
test('denied permissions and past deadlines never schedule', async () => {
  const sync = createIOSRestScheduler();
  vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'denied' });
  await sync(notice); await sync({ ...notice, restEnd: 1 });
  expect(LocalNotifications.schedule).not.toHaveBeenCalled();
});
test('rapid schedule, extension and reset execute in order; errors permit retry', async () => {
  const sync = createIOSRestScheduler();
  await Promise.all([sync(notice), sync({ ...notice, restEnd: 30000 }), sync(null)]);
  expect(vi.mocked(LocalNotifications.cancel).mock.invocationCallOrder[0]).toBeGreaterThan(vi.mocked(LocalNotifications.schedule).mock.invocationCallOrder[1]);
  vi.mocked(LocalNotifications.schedule).mockRejectedValueOnce(new Error('native failure'));
  await expect(sync(notice)).rejects.toThrow('native failure');
  await expect(sync(notice)).resolves.toBeUndefined();
});
