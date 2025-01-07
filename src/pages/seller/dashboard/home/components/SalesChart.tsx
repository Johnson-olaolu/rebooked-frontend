import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import bookService from "@/services/book.service";
import { TimeQuery, timeQueryOptions } from "@/utils/constants";
import { useUserStore } from "@/store";
import { formatBookSoldQuery } from "@/utils/misc";

export default function SalesChart() {
  const { user } = useUserStore();
  const [timeQuery, setTimeQuery] = useState<TimeQuery>(TimeQuery.LAST_SIX_MONTHS);

  const { data } = useQuery({
    queryKey: ["book", timeQuery],
    queryFn: async () => {
      const res = await bookService.querySoldBooks({
        timeQuery: timeQuery,
        userId: user?.id,
      });
      // return res.data;
      const totalBooksSold = res.data?.length;
      const totalPrice = res.data?.reduce((acc, book) => acc + book.price, 0);
      const formattedData = formatBookSoldQuery(res.data || [], timeQuery);

      return {
        totalBooksSold,
        totalPrice,
        data: formattedData,
      };
    },
    placeholderData: keepPreviousData,
  });

  console.log();
  // console.log();
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Sales Overview</CardTitle>
        <Select defaultValue={timeQuery} onValueChange={(value: TimeQuery) => setTimeQuery(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeQueryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="block md:flex gap-4">
          <div className="h-[300px] flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="numBooksSold" stroke="#8884d8" strokeWidth={2} name="Books Sold" />
                <Line yAxisId="right" type="monotone" dataKey="totalPrice" stroke="#82ca9d" strokeWidth={2} name="Total Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 w-48">
            <div className=" bg-secondary p-4 rounded-lg text-right">
              <h3 className="text-lg font-semibold mb-2">Total Books Sold</h3>
              <p className="text-3xl font-bold">{data?.totalBooksSold}</p>
            </div>
            <div className=" bg-secondary p-4 rounded-lg text-right">
              <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold">${data?.totalPrice?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
