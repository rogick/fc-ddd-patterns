import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: console.log,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterAll(async () => {
    console.log("closing...")
    await sequelize.close();
  });

  async function createOrder(customerRepository: CustomerRepository = new CustomerRepository(), productRepository: ProductRepository = new ProductRepository(), id: string = "123", num: string = "1"): Promise<Order> {
    const customer = new Customer(id, "Customer " + num);
    const address = new Address("Street " + num, 1, "Zipcode " + num, "City " + num);
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const product = new Product(id, "Product " + num, 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      id,
      product.name,
      product.price,
      product.id,
      2
    );

    return new Order(id, id, [orderItem]);
  } 

  it("should create a new order", async () => {
    const order = await createOrder();

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    const orderItem = order.items[0];
    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();
    const productRepository = new ProductRepository();
    const order = await createOrder(customerRepository, productRepository);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const product = new Product("456", "Product 2", 30);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "2",
      product.name,
      product.price,
      product.id,
      5
    );

    order.items.push(orderItem);
    
    orderRepository.update(order);

    const orderResult = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderResult);
  });

  it("should find a order", async () => {
    const order = await createOrder();

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderResult = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderResult);

  })

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const productRepository = new ProductRepository();
    const orderRepository = new OrderRepository();
    const order1 = await createOrder(customerRepository, productRepository);
    await orderRepository.create(order1);
    const order2 = await createOrder(customerRepository, productRepository, "456", "2");
    await orderRepository.create(order2);

    const orders = [order1, order2];
    
    const ordersResult = await orderRepository.findAll();

    expect(orders).toStrictEqual(ordersResult);

  })
});
