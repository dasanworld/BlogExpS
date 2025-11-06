"use client";

import { useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApplyMutation } from '@/features/application/hooks/useApplyMutation';
import { useToast } from '@/hooks/use-toast';

const Schema = z.object({
  motivation: z.string().trim().min(1).max(1000),
  visitDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), '유효한 날짜를 입력하세요.'),
});

type Values = z.infer<typeof Schema>;

export function ApplyForm({ campaignId, disabled }: { campaignId: string; disabled?: boolean }) {
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { motivation: '', visitDate: '' } });
  const { toast } = useToast();
  const mutation = useApplyMutation();

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;
  const isDisabled = disabled || isSubmitting;

  const minDate = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const onSubmit = async (values: Values) => {
    try {
      const res = await mutation.mutateAsync({ campaignId, motivation: values.motivation, visitDate: values.visitDate });
      toast({ title: '지원 완료', description: '체험단 지원이 접수되었습니다.' });
      form.reset();
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '지원 요청에 실패했습니다.';
      toast({ title: '오류', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h3 className="text-base font-semibold text-slate-100">체험단 지원</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="motivation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>각오 한마디</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="본인의 강점과 포부를 간단히 적어주세요." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>방문 예정일자</FormLabel>
                <FormControl>
                  <Input type="date" min={minDate} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isDisabled}>
              {isSubmitting ? '제출 중...' : '지원 제출'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

