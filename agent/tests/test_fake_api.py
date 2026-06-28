import fake_api


def test_get_menu_returns_all_items_without_category():
    menu = fake_api.get_menu()
    assert len(menu) == 10
    assert all({"id", "name", "price", "available", "category"} <= set(i) for i in menu)


def test_get_menu_filters_by_category():
    pizzas = fake_api.get_menu("pizza")
    assert len(pizzas) == 5
    assert all(i["category"] == "pizza" for i in pizzas)


def test_get_menu_accepts_ukrainian_alias():
    assert fake_api.get_menu("піца") == fake_api.get_menu("pizza")


def test_get_item_details_returns_full_info():
    item = fake_api.get_item_details("pz1")
    assert item["success"] is True
    assert item["name"] == "Маргарита"
    assert "description" in item and "size_cm" in item


def test_get_item_details_unknown_id_returns_error():
    res = fake_api.get_item_details("nope")
    assert res["success"] is False
    assert "error" in res


def test_create_order_computes_total():
    res = fake_api.create_order(
        items=[{"id": "pz1", "quantity": 2}, {"id": "dr1", "quantity": 1}],
        customer_name="Тест",
        phone="+380000000000",
        address="вул. Тестова, 1",
    )
    assert res["success"] is True
    assert res["total"] == 189 * 2 + 49
    assert res["order_id"].startswith("ORD-")


def test_create_order_rejects_unavailable_item():
    res = fake_api.create_order(
        items=[{"id": "pz4", "quantity": 1}],  # Гавайська — available=False
        customer_name="Тест",
        phone="+380000000000",
        address="вул. Тестова, 1",
    )
    assert res["success"] is False


def test_get_order_status_known_order():
    res = fake_api.get_order_status("ORD-101")
    assert res["success"] is True
    assert res["status"] == "Готується"


def test_get_order_status_unknown_order():
    res = fake_api.get_order_status("ORD-999")
    assert res["success"] is False
