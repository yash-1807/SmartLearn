import { Card, CardContent } from "@/components/ui/card";

export function CourseCard({ title, image }) {
  return (
    <Card className="overflow-hidden rounded-xl border-none shadow-md w-[300px]">
      <div className="relative">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full h-48 object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-center">{title}</h3>
      </CardContent>
    </Card>
  );
}
