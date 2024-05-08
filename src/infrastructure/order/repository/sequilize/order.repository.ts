import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
      },
      {
        where: {
          id: entity.id,
        },
      }
    );

    await OrderItemModel.destroy({
      where: {
        order_id: entity.id
      }
    });


    for (const item of entity.items) {
      await OrderItemModel.create(
        {
            id: item.id,
            name: item.name,
            price: item.price,
            order_id: entity.id,
            product_id: item.productId,
            quantity: item.quantity,
        })
    }
  }

  async find(id: string): Promise<Order> {
    let model;
    //// try {
    model = await OrderModel.findOne({
      where: {
        id,
      },
      include: ["items"],
      rejectOnEmpty: true,
    });
    // } catch (error) {
    //   throw new Error("Order not found");
    // }
    return new Order(
      model.id,
      model.customer_id,
      model.items.map(it => {
        return new OrderItem(it.id, it.name, it.price, it.product_id, it.quantity)
      })
    )
  }
  findAll(): Promise<Order[]> {
    throw new Error("Method not implemented.");
  }
}
